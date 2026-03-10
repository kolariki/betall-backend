const { Router } = require('express');
const { supabase } = require('../services/supabaseClient.js');
const { requireAuth, requireAdmin } = require('./auth.js');

const router = Router();

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get auth users for emails
    const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) throw authErr;

    const authMap = {};
    (authUsers || []).forEach(u => { authMap[u.id] = u; });

    const result = (profiles || []).map(p => ({
      ...p,
      email: authMap[p.id]?.email || null,
      auth_created_at: authMap[p.id]?.created_at || null,
    }));

    res.json(result);
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/admin/users/:id/toggle-admin
router.post('/users/:id/toggle-admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', id)
      .single();

    if (fetchErr || !profile) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !profile.is_admin })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: `Admin ${!profile.is_admin ? 'activado' : 'desactivado'}`, is_admin: !profile.is_admin });
  } catch (error) {
    console.error('Toggle admin error:', error);
    res.status(500).json({ error: 'Error al cambiar rol de admin' });
  }
});

// GET /api/admin/stats
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [profilesRes, marketsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('markets').select('id, status, yes_pool, no_pool'),
    ]);

    const totalUsers = profilesRes.count || 0;
    const markets = marketsRes.data || [];
    const totalMarkets = markets.length;
    const activeMarkets = markets.filter(m => m.status === 'open').length;
    const totalVolume = markets.reduce((sum, m) => sum + (parseFloat(m.yes_pool) || 0) + (parseFloat(m.no_pool) || 0), 0);

    res.json({ totalUsers, totalMarkets, activeMarkets, totalVolume: Math.round(totalVolume) });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
