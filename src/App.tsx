import React from 'react'
import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import {Contract} from "@ethersproject/contracts";
import { BigNumber } from "@ethersproject/bignumber";


import ABI from './abi.json';

const JOIN_FEE = "35000000000000000";

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    1, // Mainet
    3, // Ropsten
    4, // Rinkeby
    5, // Goerli
    42, // Kovan
  ],
})

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

export const Foosball = () => {
  const [error, setError] = React.useState('');
  const [name, setName] = React.useState('');
  const [leagueJoined, setLeagueJoined] = React.useState(false);
  const [users, setUsers] = React.useState<Map<string, {name: string, wins: number}>>(new Map());
  const { account, activate, active, library } = useWeb3React<Web3Provider>();


  React.useEffect(() => {
    activate(injectedConnector, (e) => setError(e.message));
  }, []);

  const contract = React.useMemo(() => {
    return new Contract('0x2264743A76B35Cc4b5F0c85bfaa240aB0B0fb0A7', ABI, library?.getSigner());
  }, [active]);

  React.useEffect(() => {
    const getNumUsers = async () => {
      try {
        const numUsers = await contract.numUsers();
        for (let i = 0; i < numUsers; i++) {
          const user: {a: string, weeklyWins: BigNumber, name: string} = await contract.getUser(i);
          setUsers(new Map(users.set(user.a, {name: user.name, wins: Number(user.weeklyWins.toBigInt())})));
        }
        
      } catch(e){
        console.log(e);
      }
    }
    if (active) {
      getNumUsers();
    }
  }, [active]);


  const joinLeague = async () => {
    setError('')
    try {
      await contract.joinLeague(name, {value: JOIN_FEE});
      setLeagueJoined(true);
    } catch(e) {
      setError(e.message);
      console.log('rejected', e);
    }
  }

  const wonWeek = async (winner: string) => {
    setError('')
    try {
      await contract.payWeekly(winner);
    } catch(e) {
      setError(e.message);
      console.log('rejected', e);
    }
  }

  if (!active) {
    return <div>Activating...</div>
  }
  if (leagueJoined) {
    return <div>Success! Refresh the page in a few seconds...</div>
  }

  return (
    <>
      <div>Account: {account}</div>
      <input onChange={(e) => setName(e.currentTarget.value)} value={name} placeholder="Your name"/>
      <button onClick={joinLeague} disabled={!name}>Join League</button>

      {!!users.size && 
        <div style={{marginTop: '50px'}}>
          <div>League Members</div>
          {Array.from(users).map(([userAddress, user]) => {
            return (
              <div style={{display: 'flex', marginTop: '10px'}} key={userAddress}>
                <div style={{marginRight: '10px'}}>{`${user.name} (${user.wins})`}</div>
                <button onClick={() => wonWeek(userAddress)}>Won Week</button>
              </div>
            );
          })}
        </div>
      }     

      {error && <div style={{marginTop: '20px', color: 'red'}}>Error: {error}</div>}

    </>
  )
}

const App = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div style={{padding: '50px'}}>
        <Foosball />
      </div>
    </Web3ReactProvider>
  )
}

export default App;