import { Context } from "./context.js";

export function evaluate(expression: string, context: Context): boolean {
  // Remplacer les variables par leurs valeurs
  const resolvedExpression = expression.replace(
    /\$\{\{([^}]+)\}\}/g,
    (_, expr) => {
      const value = context.getVariable(expr.trim());
      return typeof value === "string" ? `"${value}"` : String(value);
    }
  );

  try {
    // Évaluer l'expression de manière sécurisée
    // eslint-disable-next-line no-new-func
    return new Function(`return ${resolvedExpression}`)() as boolean;
  } catch (error) {
    throw new Error(
      `Erreur lors de l'évaluation de l'expression "${expression}": ${error}`
    );
  }
}
