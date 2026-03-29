import type { IFCMetadata, IFCStorey, IFCElement } from '../types/bim.types';

export interface ParseResult {
  metadata: IFCMetadata;
  storeys: IFCStorey[];
  elements: IFCElement[];
}

export async function parseIFCBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  // Dynamic import keeps web-ifc out of the main bundle
  const WebIFC = await import('web-ifc');

  const ifcApi = new WebIFC.IfcAPI();
  ifcApi.SetWasmPath('/wasm/');
  await ifcApi.Init();

  const data = new Uint8Array(buffer);
  const modelId = ifcApi.OpenModel(data);

  try {
    const schema = ifcApi.GetModelSchema(modelId) ?? 'IFC2X3';

    // Storeys
    const storeyIds = ifcApi.GetLineIDsWithType(modelId, WebIFC.IFCBUILDINGSTOREY);
    const storeys: IFCStorey[] = [];
    for (let i = 0; i < storeyIds.size(); i++) {
      const id = storeyIds.get(i);
      const props = ifcApi.GetLine(modelId, id, false);
      storeys.push({
        expressId: id,
        name: props?.Name?.value ?? `Storey ${i + 1}`,
        elevation: props?.Elevation?.value ?? i * 3,
        visible: true,
      });
    }

    // Element types available in web-ifc
    const ELEMENT_TYPES: number[] = [
      WebIFC.IFCWALL,
      WebIFC.IFCWALLSTANDARDCASE,
      WebIFC.IFCSLAB,
      WebIFC.IFCBEAM,
      WebIFC.IFCCOLUMN,
      WebIFC.IFCDOOR,
      WebIFC.IFCWINDOW,
      WebIFC.IFCSTAIR,
      WebIFC.IFCROOF,
      WebIFC.IFCSPACE,
      WebIFC.IFCPIPESEGMENT,
      WebIFC.IFCDUCTFITTING,
      WebIFC.IFCFOOTING,
    ];

    const TYPE_NAMES: Record<number, string> = {
      [WebIFC.IFCWALL]: 'Wall',
      [WebIFC.IFCWALLSTANDARDCASE]: 'Wall',
      [WebIFC.IFCSLAB]: 'Slab',
      [WebIFC.IFCBEAM]: 'Beam',
      [WebIFC.IFCCOLUMN]: 'Column',
      [WebIFC.IFCDOOR]: 'Door',
      [WebIFC.IFCWINDOW]: 'Window',
      [WebIFC.IFCSTAIR]: 'Stair',
      [WebIFC.IFCROOF]: 'Roof',
      [WebIFC.IFCSPACE]: 'Space',
      [WebIFC.IFCPIPESEGMENT]: 'Pipe',
      [WebIFC.IFCDUCTFITTING]: 'Duct',
      [WebIFC.IFCFOOTING]: 'Footing',
    };

    const elements: IFCElement[] = [];
    const disciplines = new Set<string>();

    for (const typeId of ELEMENT_TYPES) {
      const ids = ifcApi.GetLineIDsWithType(modelId, typeId);
      for (let i = 0; i < ids.size(); i++) {
        const expressId = ids.get(i);
        try {
          const line = ifcApi.GetLine(modelId, expressId, false);
          const typeName = TYPE_NAMES[typeId] ?? 'Element';

          if (['Pipe', 'Duct'].includes(typeName)) disciplines.add('MEP');
          else if (['Wall', 'Slab', 'Beam', 'Column', 'Footing'].includes(typeName)) disciplines.add('Structural');
          else disciplines.add('Architectural');

          elements.push({
            expressId,
            globalId: line?.GlobalId?.value ?? '',
            type: typeName,
            name: line?.Name?.value ?? undefined,
            objectType: line?.ObjectType?.value ?? undefined,
            storey: undefined,
            material: undefined,
            properties: {},
          });
        } catch {
          // skip malformed elements
        }
      }
    }

    return {
      metadata: {
        schema,
        elementCount: elements.length,
        storeyCount: storeys.length,
        disciplines: Array.from(disciplines),
      },
      storeys,
      elements,
    };
  } finally {
    ifcApi.CloseModel(modelId);
  }
}
