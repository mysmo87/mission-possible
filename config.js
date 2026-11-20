/*
 * Mission Possible Contact Hub - content configuration
 * ------------------------------------------------------
 * This is the ONLY file you need to edit to update contacts.
 *
 *  - Add, remove or reorder people in the "experts" list below.
 *  - Each card shows: initials circle, name, email.
 *  - Set publish: false to hide someone without deleting them.
 *  - Optional region: "americas" | "emea" | "apac". If at least one person
 *    has a region, region filter buttons appear automatically.
 *  - Only publish emails that the person has approved.
 */
window.HUB_CONFIG = {
  site: {
    title: "Mission Possible | Let's Stay Connected",
    eventLabel: "World Police Summit 2026",
    noIndex: true,          // keeps the page out of search engines
  },

  // Presentation download button. Set file to "" to hide the button.
  presentation: {
    label: "Download the presentation (PDF)",
    file: "Mission-Possible-WPS-2026.pdf"
  },

  regions: {
    americas: "Americas",
    emea: "Europe & Middle East",
    apac: "Asia-Pacific"
  },

  experts: [
    { name: "Mohamed Mysara", email: "Mohamed.Mysara@sas.com", region: "", publish: true },
    { name: "Shaun Barry", email: "Shaun.Barry@sas.com", region: "", publish: true },
    { name: "Caroline Barnett", email: "Caroline.Barnett@sas.com", region: "", publish: true },
    { name: "Emmanuel Jacque", email: "Emmanuel.Jacque@sas.com", region: "", publish: true },
    { name: "Ensley Tan", email: "Ensley.Tan@sas.com", region: "", publish: true },
    { name: "John Kilburn", email: "John.Kilburn@sas.com", region: "", publish: true }
  ]
};
