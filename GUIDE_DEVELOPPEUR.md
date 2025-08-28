# Guide Développeur - a4z

## 📚 Table des matières

1. [Architecture](#architecture)
2. [Configuration du projet](#configuration-du-projet)
3. [Structure des packages](#structure-des-packages)
4. [Développement](#développement)
5. [Tests](#tests)
6. [Création de plugins](#création-de-plugins)
7. [Contribution](#contribution)

## Architecture

a4z est construit comme un monorepo utilisant pnpm workspaces, composé de plusieurs packages :

- **@a4z/cli** : Le cœur du CLI, gère les commandes et l'exécution des workflows
- **@a4z/web-server** : Serveur Express.js pour l'interface web
- **@a4z/web-ui** : Interface utilisateur Vue.js

### Technologies principales

- **Runtime** : Node.js
- **Langage** : TypeScript
- **Gestion des dépendances** : pnpm
- **Framework web** : Vue.js + Tailwind CSS
- **API** : Express.js
- **Validation** : Zod
- **Documentation** : Markdown + YAML

## Configuration du projet

### Prérequis développeur

```bash
# Versions requises
Node.js >= 14
pnpm >= 7

# Outils globaux recommandés
npm install -g typescript ts-node
```

### Installation

```bash
# Cloner le repository
git clone <repo-url>
cd automate4z

# Installer les dépendances
pnpm install

# Compiler tous les packages
pnpm build

# Lancer en mode développement
pnpm dev
```

### Structure des fichiers

```
automate4z/
├── packages/
│   ├── cli/                    # Package principal
│   │   ├── src/
│   │   │   ├── a4z.ts         # Point d'entrée
│   │   │   ├── core/          # Logique métier
│   │   │   ├── steps/         # Actions disponibles
│   │   │   └── types/         # Types TypeScript
│   │   └── package.json
│   ├── web-server/            # Serveur API
│   │   ├── src/
│   │   │   └── index.ts       # Serveur Express
│   │   └── package.json
│   └── web-ui/                # Interface utilisateur
│       ├── src/
│       │   ├── components/    # Composants Vue
│       │   └── main.ts        # Point d'entrée
│       └── package.json
├── pnpm-workspace.yaml        # Configuration workspace
└── package.json              # Configuration racine
```

## Développement

### Commandes principales

```bash
# Développement
pnpm dev          # Lance tous les packages en mode dev
pnpm build        # Compile tous les packages
pnpm lint         # Vérifie le code

# Par package
cd packages/<package>
pnpm dev          # Lance ce package en dev
pnpm build        # Compile ce package
```

### Conventions de code

1. **TypeScript**

   - Utiliser des types stricts
   - Éviter `any`
   - Documenter les interfaces publiques

2. **Nommage**

   - PascalCase pour les classes
   - camelCase pour les fonctions et variables
   - UPPER_CASE pour les constantes

3. **Documentation**
   - JSDoc pour les fonctions publiques
   - Commentaires en français
   - Documentation YAML pour les actions

### Workflow Git

1. **Branches**

   - `main` : Production
   - `develop` : Développement
   - `feature/*` : Nouvelles fonctionnalités
   - `fix/*` : Corrections de bugs

2. **Commits**
   - Messages clairs et descriptifs
   - Préfixes : feat:, fix:, docs:, etc.

## Tests

### Configuration des tests

Le projet utilise Vitest comme framework de test principal, choisi pour sa rapidité et sa compatibilité native avec Vue.js et TypeScript.

```bash
# Installation des dépendances de test
pnpm add -D vitest @vitest/ui @testing-library/vue @vue/test-utils happy-dom

# Configuration dans package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}

# Configuration Vitest (vitest.config.ts)
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
})
```

### Structure des tests

Les tests sont organisés en plusieurs catégories :

1. **Tests unitaires** (Unit Tests)

```typescript
// src/core/utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "./utils";

describe("Utils", () => {
  describe("formatDate", () => {
    it("devrait formater une date valide", () => {
      const date = new Date("2024-01-01");
      expect(formatDate(date)).toBe("01/01/2024");
    });

    it("devrait gérer les cas d'erreur", () => {
      expect(() => formatDate(null)).toThrow("Date invalide");
    });
  });
});
```

2. **Tests de composants** (Component Tests)

```typescript
// src/components/Button.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Button from "./Button.vue";

describe("Button.vue", () => {
  it("devrait rendre le texte du bouton", () => {
    const wrapper = mount(Button, {
      props: {
        label: "Cliquez-moi",
      },
    });
    expect(wrapper.text()).toContain("Cliquez-moi");
  });

  it("devrait émettre un événement click", async () => {
    const wrapper = mount(Button);
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });
});
```

3. **Tests d'intégration** (Integration Tests)

```typescript
// tests/integration/workflow.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { WorkflowRunner } from "@/core/runner";
import { ConfigManager } from "@/core/configManager";

describe("Exécution de workflow", () => {
  let runner: WorkflowRunner;
  let config: ConfigManager;

  beforeEach(() => {
    config = new ConfigManager();
    runner = new WorkflowRunner(config);
  });

  it("devrait exécuter un workflow complet", async () => {
    const workflow = {
      steps: [
        {
          name: "test-step",
          action: "local.eval",
          with: { expression: "1 + 1" },
        },
      ],
    };

    const result = await runner.execute(workflow);
    expect(result.success).toBe(true);
    expect(result.steps[0].output).toBe(2);
  });
});
```

4. **Tests de bout en bout** (E2E Tests)

```typescript
// tests/e2e/workflow-execution.test.ts
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI Workflow Execution", () => {
  it("devrait exécuter un workflow via CLI", () => {
    const result = execSync("a4z run test-workflow.yaml");
    expect(result.toString()).toContain("Workflow completed successfully");
  });
});
```

### Meilleures pratiques de test

1. **Organisation**

   - Un fichier de test par module/composant
   - Nommage clair : `*.test.ts` ou `*.spec.ts`
   - Structure en dossiers miroir du code source

2. **Couverture**

   - Viser une couverture minimale de 80%
   - Tester les cas limites et d'erreur
   - Inclure des tests de régression

3. **Mocks et Stubs**

```typescript
import { vi } from "vitest";

// Mock d'un module
vi.mock("@/services/api", () => ({
  fetchData: vi.fn().mockResolvedValue({ data: "test" }),
}));

// Mock d'une fonction
const mockFn = vi.fn();
mockFn.mockImplementation(() => "valeur");
```

4. **Tests asynchrones**

```typescript
it("devrait gérer les opérations async", async () => {
  await expect(asyncFunction()).resolves.toBe("résultat");
  await expect(failingFunction()).rejects.toThrow("erreur");
});
```

### Scripts de test utiles

```bash
# Lancer tous les tests
pnpm test

# Lancer les tests en mode watch
pnpm test:watch

# Lancer les tests avec l'interface utilisateur
pnpm test:ui

# Générer un rapport de couverture
pnpm test:coverage

# Lancer les tests d'un fichier spécifique
pnpm test src/components/Button.test.ts

# Lancer les tests avec un pattern
pnpm test "src/**/*.test.ts"
```

## Création de plugins

### Structure d'un plugin

```typescript
// mon-plugin/index.ts
import { z } from "zod";

export const steps = {
  "mon-plugin.action": {
    schema: z.object({
      param1: z.string(),
      param2: z.number().optional(),
    }),

    async run(step, context) {
      // Implémentation
      return { result: "valeur" };
    },
  },
};
```

### Documentation du plugin

````yaml
# mon-plugin.doc.yaml
name: mon-plugin.action
description: |
  Description détaillée de l'action
  sur plusieurs lignes si nécessaire

inputs:
  - name: param1
    type: string
    required: true
    description: Premier paramètre

  - name: param2
    type: number
    required: false
    description: Deuxième paramètre optionnel

outputs:
  - name: result
    type: string
    description: Résultat de l'action

examples: |
  ```yaml
  - name: exemple
    action: mon-plugin.action
    with:
      param1: "valeur"
      param2: 42
````

```

### Publication d'un plugin

1. Créer un package npm
2. Ajouter les dépendances nécessaires
3. Compiler en JavaScript
4. Publier sur npm ou en local

## Contribution

### Process de contribution

1. Fork du projet
2. Créer une branche (`feature/ma-fonctionnalite`)
3. Développer en suivant les conventions
4. Ajouter des tests
5. Créer une Pull Request

### Checklist Pull Request

- [ ] Tests ajoutés/mis à jour
- [ ] Documentation mise à jour
- [ ] Changelog mis à jour
- [ ] Code lint passé
- [ ] Tests passés

### Support

Pour obtenir de l'aide :
1. Consulter la documentation existante
2. Ouvrir une issue sur GitHub
3. Contacter l'équipe de développement

## Bonnes pratiques

### Sécurité

1. **Gestion des secrets**
   - Utiliser le gestionnaire de secrets intégré
   - Ne jamais commiter de secrets
   - Valider les entrées utilisateur

2. **Authentification**
   - Utiliser les mécanismes d'auth intégrés
   - Vérifier les permissions
   - Logger les accès sensibles

### Performance

1. **Optimisation**
   - Mise en cache appropriée
   - Gestion efficace des ressources
   - Fermeture des connexions

2. **Monitoring**
   - Logging structuré
   - Métriques importantes
   - Gestion des erreurs

### Maintenabilité

1. **Code**
   - DRY (Don't Repeat Yourself)
   - SOLID principles
   - Tests unitaires

2. **Documentation**
   - Mise à jour régulière
   - Exemples pratiques
   - Changelog détaillé

---

Pour plus d'informations techniques, consultez :
- [Documentation API](./api.md)
- [Guide de contribution](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
```
