# Esquema de receta (Recipe)

Cada archivo en `src/data/recipes/*.json` es un array de objetos con esta forma exacta:

```json
{
  "id": "kebab-case-ascii-unico",
  "title": "Título de la receta",
  "description": "1-2 frases apetitosas y concretas.",
  "emoji": "🥑",
  "diet": "vegana | vegetariana",
  "category": "desayuno | plato-principal | entrada | sopa | ensalada | postre | snack | bebida | salsa | pan",
  "cuisine": "ver lista",
  "difficulty": "fácil | media | difícil",
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "servings": 4,
  "ingredients": [
    { "name": "garbanzos cocidos", "quantity": 400, "unit": "g", "note": "escurridos" },
    { "name": "sal", "quantity": null, "unit": null, "note": "al gusto" }
  ],
  "steps": ["Paso 1...", "Paso 2..."],
  "tags": ["rápido", "sin gluten"],
  "tips": ["Consejo 1", "Consejo 2"],
  "nutrition": { "calories": 350, "protein": 12, "carbs": 40, "fat": 14, "fiber": 9 },
  "veganAlternative": "Solo si diet = vegetariana: cómo veganizarla.",
  "sources": [{ "name": "Nombre del sitio", "url": "https://..." }]
}
```

## Cocinas permitidas
Mexicana, Colombiana, Peruana, Argentina, Venezolana, Brasileña, Cubana, Chilena, Latinoamericana, Caribeña, Estadounidense, Italiana, Española, Francesa, Griega, Mediterránea, Medio Oriente, Marroquí, Turca, Alemana, Británica, Europea, India, Tailandesa, China, Japonesa, Vietnamita, Coreana, Indonesia, Asiática, Africana, Etíope, Internacional

## Unidades permitidas
g, kg, ml, l, cucharada, cucharadita, taza, unidad, pizca, diente, rama, hoja, rebanada, lata, puñado, sobre, manojo, chorrito
(Si es "al gusto": quantity null, unit null, note "al gusto")

## Etiquetas permitidas
rápido, sin gluten, alto en proteína, sin frutos secos, sin soya, económico, para niños, meal prep, picante, sin azúcar añadida, crudo, una olla, al horno, sin horno, bajo en calorías, reconfortante, para fiestas, verano, invierno, tradicional, fusión, airfryer
