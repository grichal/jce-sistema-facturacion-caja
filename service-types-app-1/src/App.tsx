import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ServiceTypesPage from './pages/ServiceTypesPage';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" component={ServiceTypesPage} />
      </Switch>
    </Router>
  );
};

export default App;