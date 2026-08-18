import React from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import App from './App.jsx';
import './styles.css';
import './remaster.css';
import './motion-overhaul.css';
import './world.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;

createRoot(document.getElementById('root')).render(
  <App />
);
