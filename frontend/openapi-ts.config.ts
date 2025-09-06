import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:8000/openapi.json',
    output: 'src/api/client',
    plugins: [
        {
            name: '@hey-api/sdk',
            client: '@hey-api/client-axios',
        },
        {
            name: '@hey-api/client-axios',
            baseUrl: '/api',
        },
    ],
});