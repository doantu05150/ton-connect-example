import { Buffer } from "buffer";
import './style.css'
import { tonConnect, tonTransfer } from './ton-connect.ts'

(window as any).Buffer = Buffer;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div id="ton-action" class="wrapper">
    </div>
    <div>
      <p>Sample TON Transfer</p>
      <div id="ton-transfer" class="wrapper flex-col">
      </div>
    </div>
  </div>
`

tonConnect(document.querySelector<HTMLButtonElement>('#ton-action')!)
tonTransfer(document.querySelector<HTMLButtonElement>('#ton-transfer')!)
