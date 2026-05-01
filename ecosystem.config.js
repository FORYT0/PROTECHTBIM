module.exports = {
  apps: [{
    name: 'protechtbim-api',
    script: 'apps/api/dist-bundle/main.js',
    cwd: 'C:/Users/User/AndroidStudioProjects/PROTECHT BIM',
    restart_delay: 3000,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://protecht:protecht2024@127.0.0.1:5432/protecht_bim?sslmode=disable',
      CORS_ORIGIN: 'https://protechtbim-web.vercel.app,http://localhost:5173',
      GROQ_API_KEY: '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',
      JWT_SECRET: 'abad0917c2679de3df407c269ca1d6fab95dbee8d30cf66a54b4247e4377ae9f'
    }
  }]
};
