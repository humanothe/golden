import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const App = () => {
  const [perfilData, setPerfilData] = useState([]);
  const [branding, setBranding] = useState({});
  const [marketProducts, setMarketProducts] = useState([]);
  const [frozenAssets, setFrozenAssets] = useState([]);
  const [approvedBusinesses, setApprovedBusinesses] = useState([]);
  const [deliveryHistory, setDeliveryHistory] = useState([]);

  useEffect(() => {
    fetchPerfilData();
    fetchBranding();
    fetchMarketProducts();
    fetchFrozenAssets();
    fetchApprovedBusinesses();
    fetchDeliveryHistory();
  }, []);

  const fetchPerfilData = async () => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('full_name, saldo_gp, membership_tier');
    if (error) console.error('Error fetching perfil data:', error);
    else setPerfilData(data);
  };

  const fetchBranding = async () => {
    const { data, error } = await supabase
      .from('configuracion_marca')
      .select('*')
      .eq('id', 'f7aa0fd6-766c-45f7-a070-6e315b965559');
    if (error) console.error('Error fetching branding data:', error);
    else setBranding(data[0]);
  };

  const fetchMarketProducts = async () => {
    const { data, error } = await supabase
      .from('market_products')
      .select('*');
    if (error) console.error('Error fetching market products:', error);
    else setMarketProducts(data);
  };

  const fetchFrozenAssets = async () => {
    const { data, error } = await supabase
      .from('golden_congelados')
      .select('ticket_id, precio_congelado');
    if (error) console.error('Error fetching frozen assets:', error);
    else setFrozenAssets(data);
  };

  const fetchApprovedBusinesses = async () => {
    const { data, error } = await supabase
      .from('solicitudes_registro')
      .select('*')
      .eq('estado_aprobacion', 'aprobado');
    if (error) console.error('Error fetching approved businesses:', error);
    else setApprovedBusinesses(data);
  };

  const fetchDeliveryHistory = async () => {
    const { data, error } = await supabase
      .from('entregas_maestras')
      .select('fecha_creacion, total_pago, token_entrega');
    if (error) console.error('Error fetching delivery history:', error);
    else setDeliveryHistory(data);
  };

  return (
    <div style={{ backgroundColor: '#000000', color: '#D4AF37' }}>
      <header>
        <img src='logo_light.png' alt='Logo' />
      </header>
      <nav>
        <ul>
          <li>Home</li>
          <li>Market</li>
          <li>Congelados</li>
          <li>Afiliados</li>
          <li>Perfil</li>
        </ul>
      </nav>
      <section style={{ backgroundImage: 'url(bg_welcome.mp4)', backgroundSize: 'cover' }}>
        <h1>Welcome to the Golden Acceso App</h1>
      </section>
      <main>
        {/* Render other data: perfilData, branding, marketProducts, frozenAssets, approvedBusinesses, deliveryHistory here */}
      </main>
    </div>
  );
};

export default App;