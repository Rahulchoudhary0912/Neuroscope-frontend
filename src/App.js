import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './components/Home';
import Model3D from './components/Model3D';
import ChatbotWidget from './components/ChatbotWidget';
import './styles/main.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Switch>
                    <Route exact path="/" component={Home} />
                    <Route path="/3d-model" component={Model3D} />
                </Switch>
                <ChatbotWidget />
            </div>
        </Router>
    );
}

export default App;