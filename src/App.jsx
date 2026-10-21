import { useEffect, useState } from 'react';
import './App.css';
import Background from './components/Background.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Projects from './components/Projects.jsx';
import Cv from './components/Cv.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import Modal from './components/Modal.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.jsx';

export default function App() {
  // Tietosuojaseloste avataan sekä lomakkeen alta että footerista, joten tila on täällä
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);

  // Toiselta sivulta tultaessa (esim. /pelit/ → /#cv) selain yrittää vierittää kohteeseen
  // ennen kuin React on piirtänyt osiot, joten vieritys tehdään vasta tässä.
  // Ei decodeURIComponentia: osioiden id:t ovat pelkkiä kirjaimia, ja rikkinäinen
  // osoite (esim. #%E0) kaataisi purkamisessa koko sivun.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
  }, []);

  return (
    <>
      <Background />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects />
        <Cv />
        <Contact onOpenPrivacy={openPrivacy} />
      </main>
      <Footer onOpenPrivacy={openPrivacy} />

      <Modal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        label="Tietosuojaseloste"
        className="modal--privacy"
      >
        <PrivacyPolicy />
      </Modal>
    </>
  );
}