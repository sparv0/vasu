function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}) {
  return (
    <div className="stat-card-new">

      <div className="stat-card-top">
        <div className="stat-icon-box">
          {icon}
        </div>

        {trend && (
          <span className="stat-trend">
            {trend}
          </span>
        )}
      </div>

      <p>{title}</p>

      <h2>{value}</h2>

      {subtitle && (
        <span className="stat-subtitle">
          {subtitle}
        </span>
      )}

    </div>
  );
}

export default StatCard;
