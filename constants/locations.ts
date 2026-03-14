
export interface LocationStructure {
    [city: string]: {
        [municipality: string]: string[]; // Array of sectors
    };
}

export const DR_LOCATIONS: LocationStructure = {
    "Santo Domingo": {
        "Distrito Nacional": [
            "Piantini", "Naco", "Paraíso", "Evaristo Morales", "Bella Vista", 
            "Mirador Sur", "Gazcue", "Ciudad Colonial", "Ensanche Quisqueya", 
            "Los Cacicazgos", "Julieta", "La Esperilla"
        ],
        "Santo Domingo Este": [
            "Alma Rosa I", "Alma Rosa II", "Ensanche Ozama", "Corales del Sur", 
            "Invivienda", "San Isidro", "Megacentro Area"
        ],
        "Santo Domingo Oeste": [
            "Herrera", "Las Caobas", "Manoguayabo", "Alameda"
        ],
        "Santo Domingo Norte": [
            "Villa Mella", "Sabana Perdida", "Ciudad Modelo"
        ]
    },
    "Santiago": {
        "Santiago de los Caballeros": [
            "Los Jardines", "Villa Olga", "La Trinitaria", "Cerros de Gurabo", 
            "La Esmeralda", "Rincón Largo", "El Embrujo"
        ],
        "Tamboril": ["Centro", "Canca"],
        "Licey al Medio": ["Centro"]
    },
    "La Altagracia": {
        "Higüey": ["Centro", "Savica", "Cambelén"],
        "Punta Cana / Bávaro": [
            "Punta Cana Village", "Cap Cana", "Cocotal", "Friusa", "El Cortecito", 
            "Verón", "Ciudad La Palma"
        ]
    },
    "San Cristóbal": {
        "San Cristóbal (Municipio)": [
            "Madre Vieja Sur", "Madre Vieja Norte", "Centro del Pueblo", "Lavapiés"
        ],
        "Haina": ["Centro", "Piedra Blanca"]
    },
    "La Romana": {
        "La Romana (Municipio)": [
            "Casa de Campo", "Buena Vista", "Romana del Oeste", "Centro"
        ]
    },
    "Puerto Plata": {
        "San Felipe": ["Torre Alta", "Bayardo", "Centro"],
        "Sosúa": ["El Batey", "Los Charamicos"],
        "Cabarete": ["Centro"]
    },
    "San Francisco de Macorís": {
        "San Francisco": ["Urbanización Piña", "El Tejar", "Centro"]
    },
    "La Vega": {
        "Concepción de La Vega": ["Villa Palmarito", "El Vedado", "Centro"]
    }
};
