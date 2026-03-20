import { Board, BoardType } from '../../entities/Board';
import { BoardColumn } from '../../entities/BoardColumn';

describe('Board Entity', () => {
  it('should create a board instance with required fields', () => {
    const board = new Board();
    board.projectId = 'test-project-id';
    board.name = 'Test Board';
    board.boardType = BoardType.BASIC;

    expect(board.projectId).toBe('test-project-id');
    expect(board.name).toBe('Test Board');
    expect(board.boardType).toBe(BoardType.BASIC);
  });

  it('should support all board types', () => {
    expect(BoardType.BASIC).toBe('basic');
    expect(BoardType.STATUS).toBe('status');
    expect(BoardType.TEAM).toBe('team');
    expect(BoardType.VERSION).toBe('version');
  });

  it('should allow optional configuration field', () => {
    const board = new Board();
    board.projectId = 'test-project-id';
    board.name = 'Test Board';
    board.boardType = BoardType.STATUS;
    board.configuration = { autoAssign: true, defaultStatus: 'open' };

    expect(board.configuration).toEqual({ autoAssign: true, defaultStatus: 'open' });
  });
});

describe('BoardColumn Entity', () => {
  it('should create a board column instance with required fields', () => {
    const column = new BoardColumn();
    column.boardId = 'test-board-id';
    column.name = 'To Do';
    column.position = 0;

    expect(column.boardId).toBe('test-board-id');
    expect(column.name).toBe('To Do');
    expect(column.position).toBe(0);
  });

  it('should allow optional status mapping', () => {
    const column = new BoardColumn();
    column.boardId = 'test-board-id';
    column.name = 'In Progress';
    column.position = 1;
    column.statusMapping = 'in_progress';

    expect(column.statusMapping).toBe('in_progress');
  });

  it('should allow optional WIP limit', () => {
    const column = new BoardColumn();
    column.boardId = 'test-board-id';
    column.name = 'In Progress';
    column.position = 1;
    column.wipLimit = 5;

    expect(column.wipLimit).toBe(5);
  });
});
