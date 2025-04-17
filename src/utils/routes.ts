import { Hono } from "hono";

export function displayRoutes(app: Hono) {
    console.log("\nRoutes exposées :");
    console.log("================\n");
    
    const routes = app.routes;
    const methodColors: { [key: string]: string } = {
        GET: "\x1b[32m",     // Vert
        POST: "\x1b[33m",    // Jaune
        PUT: "\x1b[34m",     // Bleu
        DELETE: "\x1b[31m",  // Rouge
        PATCH: "\x1b[35m",   // Magenta
    };
    const reset = "\x1b[0m";

    routes.forEach(route => {
        const method = route.method;
        const path = route.path;
        const color = methodColors[method] || "";
        console.log(`${color}${method.padEnd(6)}${reset} ${path}`);
    });
    
    console.log("\n");
} 