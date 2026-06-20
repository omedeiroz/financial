module.exports = (err, _req, res, _next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({
    error: 'Erro interno do servidor',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
