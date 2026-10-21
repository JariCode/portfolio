import { useState } from 'react';
import '../App.css';
import './PelitPage.css';
import Background from '../components/Background.jsx';
import Navbar from '../components/Navbar.jsx';
import Games from '../components/Games.jsx';
import Footer from '../components/Footer.jsx';
import Modal from '../components/Modal.jsx';
import PrivacyPolicy from '../components/PrivacyPolicy.jsx';

export default function PelitPage() {
  // Footerin tietosuojalinkki toimii myös pelisivulla
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="pelit-page">
      <Background />
      <Navbar page="pelit" />
      <main>
        <Games />
      </main>
      <Footer page="pelit" onOpenPrivacy={() => setPrivacyOpen(true)} />

      <Modal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        label="Tietosuojaseloste"
        className="modal--privacy"
      >
        <PrivacyPolicy />
      </Modal>
    </div>
  );
}