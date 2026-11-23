type GoogleMapsDirectionsProps = {
  location: string;
};

export default function GoogleMapsDirections({
  location,
}: GoogleMapsDirectionsProps) {
  if (!location.trim()) {
    return null;
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
    >
      Get Directions
    </a>
  );
}
