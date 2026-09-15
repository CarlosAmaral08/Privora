import "./styles.css";
import { mountPopup } from "./ui/popup";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Elemento raiz da extensão não encontrado.");
}

mountPopup(root);
