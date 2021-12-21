import React, {useState, useEffect} from 'react';
import { ethers } from "ethers";
import {Button, displayNumber} from './components'
import './App.css';

const {ethereum} = window

const App = () => {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [connectingMetaMask, setConnectingMetaMask] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [accountDetails, setAccountsDetails] = useState([]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [myData, setMyData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [txHashes, setTxHashes] = useState([]);
  const [txtHash, setTxHash] = useState('');
  const [isTxHash, setIsTxHash] = useState(false);

  const checkIfMetaMaskInstalled = () => {
    if (ethereum) {
      setIsMetaMaskInstalled(true);
    } else {
      setIsMetaMaskInstalled(false);
    }
  }
  useEffect(() => {
    checkIfMetaMaskInstalled()
  }, []);

  const checkIfMetaMaskConnected = async () => {
    if (ethereum) {
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      setWalletAddress(accounts[0]);
      if(accounts[0] !== undefined) {
      const balance = await ethereum.request({method: 'eth_getBalance', params: [accounts[0], 'latest']})
      setBalance(Number(balance))
      const newData = [{address: accounts[0], balance: Number(balance)}]
      setAccountsDetails(prevState => [...prevState, ...newData])
      setIsMetaMaskConnected(true);
      setConnectingMetaMask(false);
      }
    } else {
      setIsMetaMaskConnected(false);
    }
  }

  useEffect(() => {
    checkIfMetaMaskConnected()
  }, [])


  const connectToMetaMask = () => {
    setConnectingMetaMask(true) 
    ethereum.request({ method: 'eth_requestAccounts' })
    .then((res) => {
      setConnectingMetaMask(false)
      setIsMetaMaskConnected(true)
    })
    .catch(() => {
      setConnectingMetaMask(false)
    })
  }

  const updateAccounts = async (data) => {
    setWalletAddress(data);
    const balance = await ethereum.request({method: 'eth_getBalance', params: [data, 'latest']})
    setBalance(Number(balance))
    const newData = [{address: data, balance: Number(balance)}]
    setAccountsDetails(prevState => [...prevState, ...newData])
  }

  useEffect(() => {
    if (ethereum) {
      ethereum.on('accountsChanged', (accounts) => {
        updateAccounts(accounts[0])
      })
  }
  }, [])

  const checkIfWalletHasEnoughBalance = () => {
    if (displayNumber(balance) > 0) {
      setIsButtonDisabled(false)
      setErrorMessage('')
    } else {
      setIsButtonDisabled(true)
      setErrorMessage('low_balance')
    }
  }

  useEffect(() => {
    checkIfWalletHasEnoughBalance()
  }, [balance])

  useEffect(() => {
    let uniqueArray = accountDetails.filter((v,i,a)=>a.findIndex(t=>(t.address===v.address))===i)
    setMyData(uniqueArray)
  }, [accountDetails])


  const shareEthBalance = async () => {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner();
    const getWalletBalance = await signer.getBalance()
    const divideByTotalSelected = getWalletBalance.div(myData.length)
    const valueInWei = ethers.utils.hexlify(divideByTotalSelected)


    for (let index = 1; index < myData.length; index++) {
      const element = myData[index];
      const transactionParameters = {
        nonce: '0x00', // Nonce is optional
        gasPrice: '0x5208', // Gas price in wei, optional
        gas: '0x5208', // 21000
        to: element.address, // Address of the recipient
        from: ethereum.selectedAddress, // Address of the sender
        value: valueInWei, // Amount of ether to send
        chainId: '0x4', // EIP 155 chainId - mainnet: 1, rinkeby: 4
      };
      
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      }); 
      
      const newTxHashes = [...txHashes, txHash];
      setTxHashes(newTxHashes);
    }
  }

  const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const getTransactionReceipts = async () => {
    let mined = txHashes.length;

    while(mined > 0) {
      for (let index = 0; index < txHashes.length; index++) {
        const element = txHashes[index];
        const receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [element],
        });
        if (receipt && receipt.status === '0x1') {
          mined--;
          setTxHash(element)
          const newTxHashes = txHashes.filter(txHash => txHash !== element)
          setTxHashes(newTxHashes)
        } else {
          setTxHash(element)
        }
      }
      await wait(1000);
  }
  }

  useEffect(() => {
    if (txHashes.length > 0) {
      getTransactionReceipts()
    }
  }, [txHashes])


  setTimeout(() => {
    if (isTxHash) {
    setIsTxHash(false)
    }
  }, 10000);

  // with a usereffect, check when txtHash changges, inform the user and get new balance
  useEffect(() => {
    if (txtHash) {
    const updateBalance = async () => {
      setIsTxHash(true)
      const balance = await ethereum.request({method: 'eth_getBalance', params: [walletAddress, 'latest']})
      setBalance(Number(balance))
    }
    updateBalance()
  }
  }, [txtHash, walletAddress])


  return (
    <div className="App">
      {!isMetaMaskConnected && 
        <section>
          <h2 className="title">✨ Hey there!</h2>
          <h5 className='description'>{`I created this simple DApp to help split funds across connected accounts. ${isMetaMaskInstalled ? 'Connect' : 'Install'} MetaMask to get started`}</h5>
          {connectingMetaMask ? <Button text="Connecting to MetaMask" loading /> : isMetaMaskInstalled ? <Button text="Connect to MetaMask" onClick={connectToMetaMask} /> : <Button text="Install MetaMask" />}
        </section>
      }

      {isMetaMaskConnected && 
        <section>
          <h2 className="title">✨ Hi friend!</h2>
          <div className="view">
            <div className="label">Wallet address:</div>
            <div className="value">{walletAddress && walletAddress.substring(0, 5) + '...' + walletAddress.substring(38)}</div>
          </div>
          <div className="view">
            <div className="label">Balance:</div>
            <div className="value">{`${displayNumber(balance)} Eth`}</div>
          </div>
        {isMetaMaskConnected && <Button text="Split Eth" onClick={shareEthBalance} disable={isButtonDisabled}/>}
        {myData.length < 2 && <h5 className='description'>{`You need to connect at least 2 accounts to split funds`}</h5>}
        {errorMessage === 'low_balance' && <h5 className='description'>You don't have enough balance to split</h5>}
        {isTxHash && <a href={`https://rinkeby.etherscan.io/tx/${txtHash}`} target="_blank" rel='noreferrer'><h5 className='description_txn'>Transaction sent! Tap to view</h5></a>}
        </section>
      }
    </div>
  );
}

export default App;
