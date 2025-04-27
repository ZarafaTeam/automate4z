# a4z

🚀 **a4z** est un CLI modulaire pour exécuter des workflows YAML, localement ou en interaction avec des mainframes IBM z/OS.  
Le projet est écrit en **TypeScript**, extensible via des **plugins**.

---

## 📦 Installation

```bash
npm install
npm run build
```

---

## 🚀 Utilisation du CLI

### Exécuter un workflow

```bash
node dist/a4z.js run <fichier-workflow.yaml> [options]
```

**Options :**

- `--env key=value` : Injecter des variables d'environnement.

---

### Gérer les plugins

Ajouter un plugin :

```bash
node dist/a4z.js add-plugin <fichier.zip ou url>
```

Lister les plugins installés :

```bash
node dist/a4z.js list-plugins
```

Supprimer un plugin :

```bash
node dist/a4z.js remove-plugin <nom-du-plugin>
```

---

## 📜 Structure d'un fichier Workflow YAML

```yaml
env:
  region: "EU"

steps:
  - name: my-first-step
    action: local.eval
    with:
      expression: "'Hello ' + env.region"

  - name: conditional-step
    if: "{{ env.region === 'EU' }}"
    action: local.eval
    with:
      expression: "'Special for Europe'"
```

✅ Chaque step peut avoir :

- `if:` pour conditionner son exécution
- `active:` pour désactiver dynamiquement
- `output:` pour exposer des résultats
- `forEach:` pour boucler sur une liste

---

## 🔁 Exécution de sous-steps (control.for-each)

```yaml
- name: loop-users
  action: control.for-each
  with:
    items:
      - { name: "Alice" }
      - { name: "Bob" }
  steps:
    - name: greet
      action: local.eval
      with:
        expression: "'Hello ' + item.name"
      output:
        greeting: result
```

---

## 🛠️ Développer un plugin

Un plugin est un module exportant plusieurs steps sous forme d'un objet :

```ts
export const steps = {
  "myplugin.hello": {
    schema: z.object({ name: z.string() }),
    run: async (step, context) => {
      console.log(`Hello ${step.with.name}`);
      return { result: `Hello ${step.with.name}` };
    },
  },
};
```

---

## 📂 Arborescence du projet

```
src/
  a4z.ts       # CLI principal
  core/        # Moteur interne
  types/       # Types partagés
  steps/       # Steps internes (local, control)
examples/
  workflow.yaml # Exemples de workflows
a4z_plugins/    # Plugins installés
```

---

## 🔥 Pourquoi utiliser a4z ?

- 🔧 Flexible : local + mainframe
- 🔁 Boucles et conditions intégrées
- 🧩 Extensible facilement avec des plugins
- 🛡️ Validation stricte des workflows YAML
- 📜 Typage TypeScript strict

---

## ✨ Licence

MIT
