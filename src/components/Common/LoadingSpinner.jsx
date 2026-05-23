
export default function LoadingSpinner({ fullPage = false, size = '32px' }) {
  const spinner = (
    <div 
      className="animate-spin rounded-full border-t-2 border-r-2 border-primary" 
      style={{ 
        width: size, 
        height: size,
        borderStyle: 'solid',
        borderWidth: '3px',
        borderColor: 'var(--primary) transparent transparent transparent',
        borderRadius: '50%'
      }} 
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999]">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinner}
    </div>
  );
}
