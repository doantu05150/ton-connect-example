import { Account, TonConnectUI } from '@tonconnect/ui' 
import { Address, beginCell, comment, toNano } from "ton";


function createTonConnectInstance() {
  return new TonConnectUI({
    manifestUrl: 'https://tondouble.xyz/tonconnect-manifest.json', // temp. update it before going prod
  })
}

let tonConnectUI: TonConnectUI | null = createTonConnectInstance()

function createButton(id: string, text: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.id = id
  button.innerText = text
  return button
}

function createInput(id: string, type: string, placeholder: string) {
  const input = document.createElement('input')
  input.type = type
  input.id = id
  input.placeholder = placeholder
  return input
}

export function tonConnect(elementRoot: HTMLButtonElement) {
  let wallet: string | undefined = undefined;
  let connected = false;
  let connectEl = elementRoot.appendChild(createButton('ton-connect', 'Connect'))
  let disconnectEl = createButton('ton-disconnect', 'Disconnect')


  function truncateAddress(address: string) {
    if (!address) {
      return ''
    }
    if (address.length < 10) {
      return address
    }
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  function syncData(account?: Account | null) {
    if (!account) {
      return;
    }
    wallet = Address.parse(account.address).toString({ bounceable: false })
    connected = true;
    connectEl.innerText = truncateAddress(wallet)
  }

  async function openModal() {
    if (connected) {
      return;
    }
    if (!tonConnectUI) {
      tonConnectUI = createTonConnectInstance()
    }
    if (tonConnectUI) {
      tonConnectUI.openModal()
    }
  }

  async function disconnect() {
    if (tonConnectUI) {
      await tonConnectUI.disconnect()
      connected = false
      wallet = undefined
      connectEl.innerText = 'Connect'
      if (disconnectEl) {
        elementRoot.removeChild(disconnectEl)
      }
    }
  }

  const localStorageKey = 'meweeee.jwtttt'
  const payloadTTLMS = 1000 * 60 * 20;

  async function signMessage() {
    if (!tonConnectUI) {
      openModal()
      return
    }
    if (tonConnectUI) {
      const wallet = tonConnectUI.wallet
      if (!wallet) {
        localStorage.removeItem(localStorageKey);

        const refreshPayload = async () => {
          if (!tonConnectUI) {
            return;
          }
          tonConnectUI.setConnectRequestParameters({ state: 'loading' });
          // const value = await backendAuth.generatePayload();
          const value: any = 'xxx lấy từ BE trả về. /generatePayload BE'
          if (!value) {
            tonConnectUI.setConnectRequestParameters(null);
          } else {
            tonConnectUI.setConnectRequestParameters({state: 'ready', value});
          }
        }

        refreshPayload();
        setInterval(refreshPayload, payloadTTLMS);
        return
      }
      const token = localStorage.getItem(localStorageKey);
      if (token) {
        return;
      }
      
      const connectItems = wallet?.connectItems
      if (connectItems?.tonProof && !('error' in connectItems.tonProof) && wallet?.account) {
        // const res = await backendAuth.checkProof(connectItems.tonProof?.proof, wallet.account)
        const result = 'xxx lấy từ BE trả về. /checkProof BE'
        if (result) {
          // Lưu access_token vào localStorage
          localStorage.setItem(localStorageKey, result);
        } else {
          alert('Please try another wallet');
          tonConnectUI.disconnect();
        }
      } else {
        alert('Please try another wallet');
        tonConnectUI.disconnect();
      }
    }
  }

  tonConnectUI?.onStatusChange((state) => {
    console.log(333, state, tonConnectUI?.connected)
    syncData(state?.account)
    // update UI and handle logic here
    if (!state?.account?.address && !tonConnectUI?.connected) { // not connected
      if (connectEl.parentNode !== elementRoot) {
        elementRoot.appendChild(connectEl)
      }
    } else { // connected
      if (disconnectEl.parentNode !== elementRoot) {
        elementRoot.appendChild(disconnectEl)
      }
    }
  })

  tonConnectUI?.connectionRestored.then((r) => {
    console.log('ton connect restored', r)
    if (r) {
      syncData(tonConnectUI?.account)
    }
    //  else {
    //   if (disconnectEl.parentNode === elementRoot) {
    //     elementRoot.removeChild(disconnectEl)
    //   }
    // }
  })

  connectEl.addEventListener('click', openModal)
  disconnectEl.addEventListener('click', disconnect)
}

export function tonTransfer(elementRoot: HTMLButtonElement) {
  const inputAmount = createInput('ton-amount', 'input', 'Amount (TON) (Required)')
  const inputDestinationAddress = createInput('ton-destination', 'text', 'Destination Address (Required)')
  const inputComment = createInput('ton-comment', 'text', 'Comment')
  const btnSend = createButton('ton-send', 'Send TON')

  // set default for comment value
  inputComment.value = 'Hello'

  elementRoot.appendChild(inputAmount)
  elementRoot.appendChild(inputDestinationAddress)
  elementRoot.appendChild(inputComment)
  elementRoot.appendChild(btnSend)

  // reference: https://docs.ton.org/develop/dapps/ton-connect/message-builders
  async function transferWithComment() {
    try {
      if (!tonConnectUI?.connected) {
        alert('Connect Wallet first')
        return
      }
      const amount = Number(inputAmount.value)
      const destination = inputDestinationAddress.value
      const comment = inputComment.value || ''
      if (!amount || !destination) {
        alert('Fill all the fields')
        return
      }
      if (!Address.isFriendly(destination)) {
        alert('Invalid address')
        return
      }
  
      const body = beginCell()
          .storeUint(0, 32) // write 32 zero bits to indicate that a text comment will follow
          .storeStringTail(comment) // write our text comment
          .endCell();
  
      const rawAddress = Address.parseFriendly(destination).address.toString()
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: rawAddress,
            amount: toNano(amount).toString(),
            payload: body.toBoc().toString("base64") // payload with comment in body
          }
        ]
      }
      const result = await tonConnectUI.sendTransaction(transaction)
      console.log({ result })
    } catch (error) {
      console.log(`transfer error: ${error}`)
    }
  }

  btnSend.addEventListener('click', transferWithComment)
}