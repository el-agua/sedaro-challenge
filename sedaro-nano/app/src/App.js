
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sim from './pages/Sim';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sim/:universe_id" element={<Sim />} />
      </Routes>
    </BrowserRouter>
  )

};

export default App;
