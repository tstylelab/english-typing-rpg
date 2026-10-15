import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Preview from './Preview';
import './preview.css';
import './fantasy.css';
import './reading-room.css';

// Separate entry: never mounts App or reads/writes the player's storage.
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>);
