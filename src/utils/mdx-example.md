# Uso de blocos de código no MDX

Para adicionar blocos de código ao seu conteúdo MDX, você pode usar a sintaxe de código cercada (fenced code blocks) do Markdown.

## Bloco de código simples

```
const greeting = "Olá, mundo!";
console.log(greeting);
```

## Código com linguagem específica

```js
// JavaScript
const sum = (a, b) => a + b
console.log(sum(5, 10)) // 15
```

```python
# Python
def sum(a, b):
    return a + b

print(sum(5, 10))  # 15
```

## Código com nome de arquivo

```typescript filename="exemplo.ts"
// TypeScript com nome de arquivo
interface User {
  id: number
  name: string
  email: string
}

function getUser(id: number): User {
  return {
    id,
    name: 'Exemplo',
    email: 'exemplo@email.com',
  }
}
```

## Sintaxe dentro do MDX

Você pode usar a sintaxe acima para adicionar blocos de código em seu conteúdo MDX. O renderizador MDX irá processar automaticamente esses blocos e aplicar o destaque de sintaxe correspondente.

Características disponíveis:

- Detecção automática de linguagem
- Exibição do nome do arquivo
- Botão de copiar código
- Estilização temática (claro/escuro)

## Código inline

Você também pode usar código inline como `const x = 10` dentro de um parágrafo.
