import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import QRCode from "qrcode.react";
import styled from "styled-components";
import { useEthers } from "@usedapp/core";
import CONTRACTADDRESS, { APIKEY } from "./Components/addresses";
import StudentABI from "./Components/StudentABI.json";
import "./App.css";

function App() {
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [newStudentCourse, setNewStudentCourse] = useState("");
  const [newlanguage, setLanguage] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [StudentId, setStudentId] = useState("");
  const [message1, setMessage1] = useState("");
  const [message, setMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  // eslint-disable-next-line
  const [tokenadd, setTokenadd] = useState("");
  const [allStudents, setAllStudents] = useState([]);
  // eslint-disable-next-line
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);

  const contractAddress = CONTRACTADDRESS;
  const contractABI = StudentABI;

  const {
    activateBrowserWallet,
    account: connectedAccount,
    deactivate,
  } = useEthers();

  useEffect(() => {
    if (connectedAccount) {
      setAccount(connectedAccount);
    }
  }, [connectedAccount]);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      provider.getNetwork().then((network) => {
        setNetwork(network);
      });
    }
  }, []);

  const connectAndActivate = async () => {
    const desiredChainId = 11155111; // Sepolia Network

    if (network && network.chainId !== desiredChainId) {
      alert(
        `Please switch to the correct chain with chainId: ${desiredChainId}`
      );
      return;
    }

    await connectToEthereum();
    await activateBrowserWallet();
  };

  const disconnectWallet = async () => {
    try {
      // Deactivate the wallet connection using @usedapp/core's deactivate method
      await deactivate();

      // Clear any other states related to the wallet connection
      setAccount(null); // Clear the connected account
      setNetwork(null); // Clear the network info
      setProvider(null); // Clear the provider object
      setContract(null); // Clear the contract instance

      // Reset other state variables if necessary
      setMessage("Wallet disconnected.");
      setTransactionHash(""); // Reset transaction hash
      setTokenadd(""); // Reset the token address

      // Optionally, show a message or update UI to indicate disconnection
      alert("Wallet disconnected. Please reconnect.");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const connectToEthereum = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        window.ethereum.on("chainChanged", (chainId) => {
          const parsedChainId = parseInt(chainId, 16);
          const desiredChainId = 11155111;
          if (parsedChainId !== desiredChainId) {
            alert(
              `Please switch to the correct chain with chainId: ${desiredChainId}`
            );
            window.location.reload();
          }
        });

        const networkId = await provider.send("net_version", []);
        if (networkId !== "11155111") {
          const switchConfirmed = window.confirm(
            `Please switch to the Chain with chainId: 11155111. Do you want to switch now?`
          );
          if (switchConfirmed) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xA4B1", // Sepolia chainId in hex format
                  chainName: "Sepolia",
                  nativeCurrency: { name: "SFC", symbol: "SFC" },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xA4B1" }],
            });
          }
        }

        setProvider(provider);

        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          provider.getSigner()
        );
        setContract(contract);
      } else {
        alert("Please install MetaMask or use a Web3-enabled browser.");
      }
    } catch (error) {
      alert("Error connecting to Ethereum:", error);
    }
  };

  const getStudent = async () => {
    try {
      if (contract) {
        const result = await contract.getStudentDetails(StudentId);
        if (result.every((field) => field === "")) {
          setMessage("Token id not exist");
        } else {
          setMessage(
            <>
              <p>First Name: {result[0]}</p>
              <p>Last Name: {result[1]}</p>
              <p>Register Number: {result[3]}</p>
              <p>Course: {result[2]}</p>
              <p>Language: {result[4]}</p>
            </>
          );
        }
      } else {
        alert("Contract not initialized.");
      }
    } catch (error) {
      alert("Error getting student:", error);
    }
  };

  const addStudent = async () => {
    setMessage("Waiting for Mint");
    try {
      if (contract) {
        if (
          !newStudentFirstName ||
          !newStudentLastName ||
          !newStudentCourse ||
          !newStudentId ||
          !newlanguage
        ) {
          alert("Please fill all fields");
        } else {
          const tx = await contract.mintStudent(
            newStudentFirstName,
            newStudentLastName,
            newStudentCourse,
            newStudentId,
            newlanguage
          );
          const receipt = await tx.wait();
          setMessage("Student minted successfully.");
          const transactionHash = tx.hash;
          const apiKey = APIKEY;
          const goerli = `https://api-sepolia.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${transactionHash}&apikey=${apiKey}`;
          const response = await axios.get(goerli);
          setTransactionHash(transactionHash);
          if (response.data.status === "1") {
            setMessage(
              `Student minted successfully. Token ID: ${receipt.events[2].args.tokenId}`
            );
            setTokenadd(receipt.events[2].args.tokenId);
            setMessage1(`Transaction Hash is : ${transactionHash}`);
          } else if (response.data.status === "0") {
            setMessage("Api execution failed.");
          } else {
            setMessage("Transaction status is unknown.");
          }
        }
      } else {
        alert("Contract not initialized.");
      }
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const getAllStudents = async () => {
    try {
      if (contract) {
        const total = await contract.TotalStudents();
        const students = [];
        for (let i = 0; i < total; i++) {
          const result = await contract.getStudentDetails(i);
          students.push({
            id: i,
            firstName: result[0],
            lastName: result[1],
            regNum: result[3],
            course: result[2],
            lang: result[4],
          });
        }
        setAllStudents(students);
      } else {
        alert("Contract not initialized.");
      }
    } catch (error) {
      alert("Error getting all students:", error);
    }
  };
  const initializeContract = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask or use a Web3-enabled browser.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const initializedContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      setProvider(provider);
      setContract(initializedContract);

      alert("Contract initialized successfully!");
    } catch (error) {
      console.error("Error initializing contract:", error);
      alert(
        "Failed to initialize the contract. Please check the console for errors."
      );
    }
  };

  const clear = () => {
    setNewStudentFirstName("");
    setNewStudentLastName("");
    setNewStudentCourse("");
    setLanguage("");
    setNewStudentId("");
    setStudentId("");
    setMessage1("");
    setMessage("");
    setAllStudents([]);
  };
  return (
    <div className="App">
      {account ? (
        <CButton onClick={disconnectWallet}>
          {account.slice(0, 4)}...{account.slice(account.length - 4)}
        </CButton>
      ) : (
        <CenteredButton onClick={connectAndActivate}>
          Connect Wallet
        </CenteredButton>
      )}

      {account && (
        <>
          {!contract && (
            <Content>
              <button onClick={initializeContract}>Initialize Contract</button>
            </Content>
          )}
          <Content>
            <button onClick={clear}>Clear</button>
          </Content>
          <h1>Issuance Portal</h1>
          <Container>
            <Overlay>
              <Content>
                <h2>Single upload</h2>
                <label>Register Number</label>
                <input
                  type="number"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                />
                <label>First Name</label>
                <input
                  type="text"
                  value={newStudentFirstName}
                  onChange={(e) => setNewStudentFirstName(e.target.value)}
                />
                <label>Last Name</label>
                <input
                  type="text"
                  value={newStudentLastName}
                  onChange={(e) => setNewStudentLastName(e.target.value)}
                />
                <label>Course</label>
                <input
                  type="text"
                  value={newStudentCourse}
                  onChange={(e) => setNewStudentCourse(e.target.value)}
                />
                <label>Language</label>
                <input
                  type="text"
                  value={newlanguage}
                  onChange={(e) => setLanguage(e.target.value)}
                />
                <button onClick={addStudent}>Add-Student</button>
              </Content>
            </Overlay>
            <Overlay>
              <Content>
                <Dis>
                  <div id="qr">
                    {transactionHash && (
                      <QRCode
                        value={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                        renderAs="svg"
                        size={128}
                      />
                    )}
                  </div>
                </Dis>
              </Content>
            </Overlay>
            <Overlay>
              <Content>
                <h2>Token ID</h2>
                <input
                  type="number"
                  value={StudentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
                <button onClick={getStudent}>Verify</button>
              </Content>
            </Overlay>
            <Overlay>
              <Content>
                <Button onClick={getAllStudents}>Get All Students</Button>
              </Content>
            </Overlay>
          </Container>
          <Dis>
            <p>{message}</p>
            <p>{message1}</p>
            <br />
            {allStudents.length > 0 && (
              <table border={1}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Reg Num</th>
                    <th>Course</th>
                    <th>Language</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.firstName}</td>
                      <td>{student.lastName}</td>
                      <td>{student.regNum}</td>
                      <td>{student.course}</td>
                      <td>{student.lang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <br />
          </Dis>
          {!account ? (
            <Dis>Connect-Wallet to Mint the Student</Dis>
          ) : !contract ? (
            <Dis>Contract not initialized. Please initialize the contract.</Dis>
          ) : (
            <Dis>Ready to Mint</Dis>
          )}
        </>
      )}
    </div>
  );
}

export default App;

const CButton = styled.button`
  cursor: pointer;
  padding: 0.7rem 2rem;
  background-color: black;
  border-radius: 50px;
  color: yellow;
  font-weight: 500;
  margin-left: 80rem;
  margin-top: 1rem;
`;

const CenteredButton = styled.button`
  cursor: pointer;
  padding: 1rem 3rem;
  background-color: black;
  border-radius: 50px;
  color: cyan;
  font-weight: 500;
  position: absolute;
  // top: 100%;
  top: 10rem;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Button = styled.button`
  cursor: pointer;
  padding: 0.7rem 2rem;
  background-color: black;
  border-radius: 50px;
  color: cyan;
  font-weight: 500;
`;

const Dis = styled.div`
  display: flex;
  align-items: center;
  max-width: 1280px;
  width: 80%;
  margin: 0 auto;
  padding: 1.5rem 0;
  position: relative;
  flex-direction: column;
  flex-wrap: nowrap;
`;

const Container = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: auto;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Overlay = styled.div`
  width: 20%;
  padding: 20px;
  border-radius: 25px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) {
    width: 70%;
    margin-bottom: 1rem;
  }
`;

const Content = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
  align-items: flex-start;
  button {
    cursor: pointer;
    margin-top: 1rem;
    padding: 0.2rem 2rem;
    background-color: black;
    border-radius: 50px;
    color: rgb(255, 255, 255);
  }
`;
