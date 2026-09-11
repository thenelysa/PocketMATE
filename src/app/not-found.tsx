import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: '#F7F8F5',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#071936', marginBottom: '1rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#4B5D7A', marginBottom: '1.5rem' }}>
        Page not found
      </h2>
      <p style={{ color: '#4B5D7A', marginBottom: '2rem' }}>
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(to right, #078D88, #19C4B6)',
          color: 'white',
          borderRadius: '0.75rem',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
