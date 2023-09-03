import { useState, useEffect } from 'react'
import { Web3Storage } from 'web3.storage'
import { contractAddress, contractABI } from './constants'
import { ethers } from 'ethers'

function App() {
    const [state, setState] = useState({
        provider: null,
        signer: null,
        contract: null,
    })
    const [connected, setConnected] = useState(false)

    const [verify, setVerify] = useState(false)
    const [account, setAccount] = useState('')

    const connectWallet = async () => {
        try {
            if (window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                })
                setAccount(accounts[0])

                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )
                const signer = provider.getSigner()
                const contract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                )
                setState({ provider, signer, contract })
                console.log('connected accounts', accounts)
                document.getElementById('connect_button').innerHTML =
                    'connected'
                setConnected(true);
            } else {
                alert('Please install metamask')
            }
        } catch (error) {
            console.log(error.code)
        }
    }

    async function uploadImg() {
        const file = document.getElementById('file').files[0]
        const files = []
        files.push(file)
        console.log(`Uploading ${files.length} files`)
        const token =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDNjOUYwZDA0MTdDMTI5MDcxYjlDMmFGNDc2MDhCNTk3M0YyRTI0N0YiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2OTM2NTc2MjcxMTcsIm5hbWUiOiJzaWduYXR1cmVWZXJpZmljYXRpb24ifQ.Vmy5HOXDCNRpBcmGLZwbCzpGpNE4qrFf1UE_43lk5tY'
        const storage = new Web3Storage({ token })
        const cid = await storage.put(files)
        console.log('Content added with CID:', cid)
        document.querySelector('#cid_display').innerHTML = cid
        getSignature(cid)
    }

    function getEthSignedMessageHash(_messageHash) {
        const prefix = '\x19Ethereum Signed Message:\n32'
        const packedMessage = ethers.utils.solidityPack(
            ['string', 'bytes32'],
            [prefix, _messageHash]
        )
        const hash = ethers.utils.keccak256(packedMessage)
        // console.log('hash', hash)
        return hash
    }

    async function getSignature(message) {
        const packedMessage = ethers.utils.solidityPack(['string'], [message])
        const hash = ethers.utils.keccak256(packedMessage)

        console.log('ethSignedHash', getEthSignedMessageHash(hash))

        const res = await window.ethereum.request({
            method: 'personal_sign',
            params: [account, hash],
        })
        console.log('signature:', res)
        document.querySelector('#signarure_display').innerHTML = res
        document.querySelector('#note').innerHTML = "Take the note of this CID and signature"
    }

    async function checkValidity() {
        let signingAuthority = document.querySelector('#signer').value
        if(signingAuthority[0]==='"'){
            signingAuthority = signingAuthority.substring(1, signingAuthority.length - 1);
        }
        const msg = document.querySelector('#msg').value
        const signature = document.querySelector('#signature').value
        const valid = await state.contract.verify(
            signingAuthority, 
            msg, 
            signature
        )
        console.log('signature is', valid)
        document.querySelector('#valid').innerHTML = `<h1>${valid}</h1>`
    }

    return (
        <div className='bg-[#E4E4D0] h-screen'>
            {/* Navbar */}
            <div className='flex justify-between items-center bg-[#94A684]'>
                <div className='m-4 font-semibold'>Krishna's signature verification dApp</div>
                <div className='mx-8 my-2'>
                    <button onClick={connectWallet} id='connect_button'
                    className='bg-[#AEC3AE] m-4 p-4 px-20 rounded-md'>
                        connect wallet
                    </button>
                </div>
            </div>

            {connected ? (
                <div>
                    <div className='flex flex-row justify-center'>
                <div
                    className={`text-3xl cursor-pointer mx-20 m-4 p-2 rounded-md ${!verify?"bg-[#94A684]":""}`}
                    onClick={() => setVerify(false)}
                >
                    upload
                </div>
                <div
                    className={`text-3xl cursor-pointer mx-20 m-4 p-2 rounded-md ${verify?"bg-[#94A684]":""}`}
                    onClick={() => setVerify(true)}
                >
                    verify
                </div>
            </div>

            {verify ? (
                <div className='flex flex-col items-center'>
                    <input
                        type='text'
                        id='signer'
                        className='m-4 p-2'
                        placeholder='signing authority address'
                    />
                    <input
                        type='text'
                        id='msg'
                        className='m-4 p-2'
                        placeholder='signed message'
                    />
                    <input
                        type='text'
                        id='signature'
                        className='m-4 p-2'
                        placeholder='signature'
                    />
                    <div className='flex justify-center items-center'>
                    <button
                        onClick={checkValidity}
                        className='bg-[#AEC3AE] m-4 p-4 px-20 rounded-md'
                    >
                        Get validation
                    </button>
                    <div id="valid" className='text-2xl font-semibold'></div>
                    </div>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center'>
                    <div className='m-8'>
                        <input type='file' id='file' />
                    </div>
                    <button
                        onClick={uploadImg}
                        className='bg-[#AEC3AE] m-4 p-4 px-20 rounded-md'
                    >
                        Upload to IPFS
                    </button>
                    <div id='cid_display' className='m-2'></div>
                    <div id='signarure_display' className='m-2'></div>
                    <div id="note"></div>
                </div>
            )}
                </div>
            ) : (
                <div className='text-3xl font-semibold flex justify-center'>
                    Please connect the wallet first!!
                </div>
            )}
        </div>
    )
}

export default App

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDNjOUYwZDA0MTdDMTI5MDcxYjlDMmFGNDc2MDhCNTk3M0YyRTI0N0YiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2OTM2NTc2MjcxMTcsIm5hbWUiOiJzaWduYXR1cmVWZXJpZmljYXRpb24ifQ.Vmy5HOXDCNRpBcmGLZwbCzpGpNE4qrFf1UE_43lk5tY
// bafybeialgtxidl34pr2jjrtoyuoxmx4pjkosngwb253kcyewzkm3iws2yi
// bafybeicrkbxo5lui46c3kic44rzaldqrlo3suqsis5ccuagv7wc3u5zwz4
// bafybeifderna6vceu5g7356g4maoj7hvf4vta722zqxtqu4xnrfwmdycqi


// bafybeifnpbznfsjuu7igjoezo2sijkruj6bqbxocp7scqfbwmo6xvk5ufq
// 0xefaeac8c6401f7a96045f132b131710597577448ee051af0c51186b93cc4e790
// 0x7dec00e5c83cfc2d59b5b3072b6daa928d3fdc09e8551af86873ecdf82a5a78561368f07b0994b0ff994afc776fd6d3eefe540b1551e67933475378c862b25c61c