import {AddGoalModal} from './components/AddGoalModal';
import {ViewGoals} from './components/ViewGoals';

import './App.scss';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Apgar Score</h1>
            </header>
            <div className='container centered-content'>
                <ViewGoals/>
                <AddGoalModal/>
            </div>
        </div>
    );
}

export default App;
