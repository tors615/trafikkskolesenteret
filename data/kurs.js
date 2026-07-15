/* Kommende kurs for Trafikkskolesenteret – lastes som vanlig <script> slik at
   det fungerer både lokalt (file://) og på alle hoster, uten fetch/CORS.
   Legg inn kurs i "kurs"-lista under for å vise dem på forsiden og booking-siden.
   Tom liste = «Ingen kurs lagt ut akkurat nå»-melding vises automatisk.
   Booking/påmelding: https://tabs.no/start */
window.JD_KURS = {
  "_oppdatert": "2026-07-15",
  "avdelinger": {
    "tynset": {
      "navn": "Tynset",
      "sted": "Parkveien 14A, 2500 Tynset",
      "kalender": "https://tabs.no/start",
      "kursoversikt": "https://tabs.no/start"
    }
  },
  "kurs": [
    // EKSEMPELKURS – bytt ut med ekte datoer fra TABS-kursoversikten før lansering.
    { "avdeling": "tynset", "klasse": "TGK", "navn": "Trafikalt grunnkurs", "start": "2026-08-18T17:00", "slutt": "2026-08-18T20:00", "pris": 1990, "plasser": "3+" },
    { "avdeling": "tynset", "klasse": "TGK", "navn": "Trafikalt grunnkurs", "start": "2026-09-15T17:00", "slutt": "2026-09-15T20:00", "pris": 1990, "plasser": 6 },
    { "avdeling": "tynset", "klasse": "TIM", "navn": "Trafikant i mørket", "start": "2026-10-07T17:00", "slutt": "2026-10-07T20:00", "pris": 1490, "plasser": 2 }
  ]
};
