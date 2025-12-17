import "./Aside.css";

export default function Aside({
  stats = null,
  availableTags = [],
  onSelectTag = () => {},
  selectedTag = null,
  onClearTag = () => {},
  showTags = true,
  searchBar = true,
}) {
  return (
    <aside className="sideMenu">
      <h>Din Saksstatistikk</h>

      {stats && (
        <div className="menuItem stats">
          <div className="open">
            <p className="openText">Åpen</p>
            <p className="openTextSecondary">{stats.open ?? 0}</p>
          </div>
          <div className="inProgress">
            <p className="inProgressText">Under Behandling</p>
            <p className="inProgressTextSecondary">{stats.inProgress ?? 0}</p>
          </div>
          <div className="closed">
            <p className="closedText">Ferdig</p>
            <p className="closedTextSecondary">{stats.closed ?? 0}</p>
          </div>
        </div>
      )}

      {showTags && (
        <div className="menuItem tagsSection">
          <h4>Filtrer etter tag</h4>
          <div className="tagControls">
            {selectedTag ? (
              <div className="selectedTagRow">
                <button className="tagPill active">{selectedTag}</button>
                <button className="clearTagBtn" onClick={onClearTag}>Fjern</button>
              </div>
            ) : (
              <div className="noTag">Ingen tag valgt</div>
            )}

            <div className="tagsList">
              {availableTags.length === 0 && <div className="noTags">Ingen tags tilgjengelig</div>}
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className={`tagPill ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => onSelectTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {searchBar && (
        <div className="menuItem searchSection">
          <h4>Søk Etter Sak</h4>
          <input
            type="text"
            placeholder="Søk etter Sak"
            onChange={(e) => {
              const searchEvent = new CustomEvent('ticketSearch', { detail: e.target.value });
              window.dispatchEvent(searchEvent);
            }}
          />
        </div>
      )}
    </aside>
  );
}