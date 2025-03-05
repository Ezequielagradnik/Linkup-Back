import { module1 } from "../data/module1.js"
import { module2 } from "../data/module2.js"

console.log("Verificando módulos disponibles:")
console.log("Módulo 1:", {
  title: module1.title,
  order: module1.order,
  sections: module1.content.sections.length,
})

console.log("Módulo 2:", {
  title: module2.title,
  order: module2.order,
  sections: module2.content.sections.length,
})

console.log("Ambos módulos cargados correctamente.")

