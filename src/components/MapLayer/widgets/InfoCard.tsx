import './InfoCard.css';

export const InfoCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="info-card">
      <div className="info-card-inner">
        {children}
      </div>
    </div>
  )
}