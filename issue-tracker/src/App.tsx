import './App.css'
import { Link, Outlet } from 'react-router-dom'

function App() {
  return (
    <div>
      <header style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #e5e5e5' }}>
        <strong>Zero Issue Tracker</strong>
        <Link to="/">Board</Link>
        <Link to="/issues">Issues</Link>
      </header>
      <Outlet />
    </div>
  )
}

export default App
