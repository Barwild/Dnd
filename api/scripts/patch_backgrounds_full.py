"""
Script de patch completo para trasfondos D&D 5e en español.
Añade/actualiza todos los trasfondos con tablas completas.
"""

import json

BACKGROUNDS_DATA = [
    {
        "index": "acolito",
        "name": "Acolito",
        "description": "Has pasado tu vida al servicio de un templo a un dios o panteón de dioses específico. Actúas como intermediario entre el mundo divino y el mundo mortal, realizando rituales sagrados y llevando sacrificios a fin de conducir a los fieles a la presencia de lo divino.",
        "skill_proficiencies": json.dumps(["Perspicacia", "Religión"]),
        "tool_proficiencies": json.dumps([]),
        "languages": json.dumps(["Dos idiomas de tu elección"]),
        "equipment": json.dumps([
            "Símbolo sagrado (regalo cuando te iniciaste en el sacerdocio)",
            "Libro de oraciones o rueda de plegarias",
            "5 varas de incienso",
            "Vestimentas",
            "Un conjunto de ropa común",
            "Bolsa con 15 po"
        ]),
        "feature_name": "Refugio de los Fieles",
        "feature_desc": "Como acolito, impones respeto entre los que comparten tu fe, y puedes realizar las ceremonias religiosas de tu deidad. Tú y tus compañeros aventureros podéis recibir curación gratuita y cuidados en un templo, santuario u otra presencia establecida de tu fe, aunque deberás proporcionar cualquier componente material necesario para los hechizos. Los que comparten tu religión te apoyarán (pero no a tus compañeros) con un modesto estilo de vida. También puedes tener lazos con un templo específico dedicado a tu deidad o panteón elegido, y tienes una residencia allí.",
        "personality_traits": json.dumps([
            "Idolatro a un héroe de mi fe, y hago referencia continuamente a las hazañas y el ejemplo de esa persona.",
            "Puedo encontrar terreno común entre los enemigos más feroces, empatizando con ellos y siempre tratando de hallar la paz.",
            "Me veo a mí mismo como alguien que necesita ser protegido y que tiene que proteger a los demás del mundo.",
            "Soy indiferente a las comodidades de la vida y nada me perturba.",
            "Tengo citas para cualquier situación que se me presente.",
            "Soy tolerante (o intolerante) con otras religiones y respeto (o condeno) la adoración de otros dioses.",
            "He disfrutado de las comodidades del templo y me resulta difícil prescindir de ellas en mis aventuras.",
            "He pasado tanto tiempo en el templo que apenas sé cómo el mundo funciona fuera de él."
        ]),
        "ideals": json.dumps([
            {"desc": "Tradición. Las antiguas costumbres y la sabiduría de los siglos de tradición deben ser preservadas y transmitidas.", "alignment": "Leal"},
            {"desc": "Caridad. Siempre trato de ayudar a los que están en necesidad, sin importar cuánto me cueste.", "alignment": "Bueno"},
            {"desc": "Cambio. Debemos ayudar a provocar los cambios que los dioses están constantemente obrando en el mundo.", "alignment": "Caótico"},
            {"desc": "Poder. Espero ascender en la jerarquía de mi templo y eventualmente alcanzar la cima.", "alignment": "Legal/Malvado"},
            {"desc": "Fe. Confío en que mi deidad guiará mis acciones. Tengo fe en que si trabajo duro, las cosas irán bien.", "alignment": "Legal"},
            {"desc": "Aspiración. Busco demostrarme a mí mismo siendo digno de la gracia de mi dios mediante las acciones.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Me esforzaré hasta dar mi vida por recuperar una reliquia sagrada de mi fe que fue perdida hace mucho tiempo.",
            "Algún día me vengaré del liderazgo corrompido del templo que me echó de él.",
            "Le debo mi vida al sacerdote que me acogió cuando mis padres murieron.",
            "Todo lo que hago es para el pueblo de la aldea que me crió.",
            "Haré todo lo posible para proteger el templo donde serví.",
            "Busco preservar un texto sagrado que mis enemigos consideran herético y trabajan para destruirlo."
        ]),
        "flaws": json.dumps([
            "Juzgo a los demás con dureza, y a mí mismo incluso más.",
            "Confío demasiado en aquellos que están en posiciones de autoridad de la iglesia.",
            "Mi piedad a veces me lleva a ciegamente confiar en aquellos que profesan la fe de mi deidad.",
            "Soy inflexible en mi pensamiento.",
            "Soy desconfiado con los extraños y espero lo peor de ellos.",
            "Una vez que me he comprometido con un objetivo, soy implacable hasta la temeridad."
        ])
    },
    {
        "index": "charlatan",
        "name": "Charlatán",
        "description": "Siempre has tenido aptitudes para influenciar en los demás. Sabes qué decirle a la gente para que haga lo que quieres, sabes cuándo es el momento oportuno para apelar a sus emociones, cuándo explotar su codicia y cuándo dejarte llevar por el miedo.",
        "skill_proficiencies": json.dumps(["Engaño", "Juego de Manos"]),
        "tool_proficiencies": json.dumps(["Herramientas de disfraz", "Herramientas de falsificación"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Un conjunto de ropa fina",
            "Herramientas de disfraz",
            "Herramientas de falsificación",
            "Reliquias elaboradas pero sin valor",
            "15 po"
        ]),
        "feature_name": "Cara Falsa",
        "feature_desc": "Si es necesario, puedes conseguir documentos de identidad falsos, ropa de disfraz y otra parafernalia de un contacto, ya sea que el contacto sea legítimo o parte de la red criminal.",
        "personality_traits": json.dumps([
            "Caigo con facilidad en el vicio, particularmente con el alcohol.",
            "Escondo mi verdadero yo con una máscara de ingenio y buen humor.",
            "Siempre intento sacar partido de cualquier situación y mirar hacia arriba.",
            "Me es difícil mantener promesas.",
            "Finjo cierta humildad y desinterés para mantener oculta mi habilidad real.",
            "Soy un mentiroso compulsivo incluso cuando no es necesario.",
            "Sinceramente aprecio estar en la presencia de personas de alto rango.",
            "Me encantan los disfraces. Me siento mucho más cómodo detrás de una máscara que siendo yo mismo."
        ]),
        "ideals": json.dumps([
            {"desc": "Independencia. Soy un espíritu libre. Nadie me dice lo que debo hacer.", "alignment": "Caótico"},
            {"desc": "Equidad. Nunca apunto a la gente que no puede permitirse perder unos pocos monedas de oro.", "alignment": "Legal"},
            {"desc": "Caridad. Distribuyo el dinero que adquiero a la gente que de verdad lo necesita.", "alignment": "Bueno"},
            {"desc": "Creatividad. Nunca uso la misma estafa en dos ocasiones.", "alignment": "Caótico"},
            {"desc": "Amistad. El material es pasajero; los lazos de amistad perduran.", "alignment": "Bueno"},
            {"desc": "Aspiración. Estoy destinado a algo grandioso.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Engañé a alguien que no lo merecía y lo arruiné. Sigo intentando hacer las paces.",
            "Las ganancias de mis engaños van a apoyar a mi familia.",
            "Algo importante para mí me lo robaron y lo utilizaron en mi contra.",
            "Me gané la enemistad de un mercader poderoso al llevarme su fortuna a través de una serie de engaños.",
            "Me enamoro de todos aquellos a los que intento estafar.",
            "Intenté engañar a la persona equivocada y ahora debo devolver el favor de alguna manera."
        ]),
        "flaws": json.dumps([
            "No puedo dejar de ver a todos los demás como objetivos potenciales.",
            "Cuando veo algo que quiero, hago lo que sea para conseguirlo.",
            "Si me hay alguien que el dinero no puede comprar, todavía no lo he conocido.",
            "Sarcasmo y chiste son mis respuestas predeterminadas a casi todo.",
            "Tengo una deuda que no puedo pagar. Los que me la concedieron quieren que la cobre para ellos.",
            "Estoy convencido de que nadie puede ver a través de mis disfraces y engaños."
        ])
    },
    {
        "index": "criminal",
        "name": "Criminal",
        "description": "Eres un experimentado delincuente con un historial de romper la ley. Has pasado mucho tiempo entre otros criminales y todavía tienes contactos en el mundo del crimen.",
        "skill_proficiencies": json.dumps(["Engaño", "Sigilo"]),
        "tool_proficiencies": json.dumps(["Un tipo de herramientas de juego", "Herramientas de ladrón"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Una palanca",
            "Un conjunto de ropa oscura con capucha",
            "Bolsa con 15 po"
        ]),
        "feature_name": "Contacto Criminal",
        "feature_desc": "Tienes un contacto de confianza que actúa como tu enlace con una red de otros criminales. Sabes cómo enviar y recibir mensajes a través de palomas mensajeras, mensajeros del submundo, y otros medios. Sabes a quién contactar para pasar mensajes incluso sobre grandes distancias.",
        "personality_traits": json.dumps([
            "Siempre tengo un plan para cuando las cosas salen mal.",
            "Estoy siempre tranquilo, sin importar la situación. Nunca levanto la voz ni dejo que mis emociones me controlen.",
            "Lo primero que hago en un nuevo lugar es notar las salidas.",
            "Prefiero hacer amigos a crear enemigos.",
            "La mejor manera de quitarte de en medio de un problema es salir de él.",
            "Soy increíblemente lento para confiar. Los que parecen más amigables tienen algo que esconder.",
            "La gente que no puede cuidarse no merece mi respeto.",
            "Trabajo duro para hacerme rico y mantenerme rico."
        ]),
        "ideals": json.dumps([
            {"desc": "Honor. No robo de los demás del oficio.", "alignment": "Legal"},
            {"desc": "Libertad. Las cadenas están hechas para romperse, igual que las leyes que las forjan.", "alignment": "Caótico"},
            {"desc": "Caridad. Robo de los ricos para dárselo a los pobres.", "alignment": "Bueno"},
            {"desc": "Avaricia. Hago lo que tengo que hacer para sobrevivir.", "alignment": "Neutral"},
            {"desc": "Personas. Soy leal a mis amigos, no a ningún ideal.", "alignment": "Neutral"},
            {"desc": "Redención. Hay una chispa de bondad en cada uno.", "alignment": "Bueno"}
        ]),
        "bonds": json.dumps([
            "Estoy tratando de pagar una vieja deuda que tengo con un generoso benefactor.",
            "Mis ganancias mal habidas van a mantener a la familia de mi hermano.",
            "Algo importante para mí me lo robaron y lo quiero recuperar.",
            "Seré rico algún día y nadie volverá a tratarme mal.",
            "Finjo actuar por el bien mayor mientras busco mis propios beneficios.",
            "Hay una persona a quien mataria si encontrara la oportunidad."
        ]),
        "flaws": json.dumps([
            "Cuando veo algo que quiero, hago lo que sea para conseguirlo.",
            "Cuando me veo acorralado, me convierto en una fiera enjaulada.",
            "El mejor plan es robar tanto como puedas y luego huir.",
            "Llevo demasiado tiempo siendo una persona horrible. No sé hacer otra cosa.",
            "Si hay un plan, lo arruinaré. Siempre tengo que improvisar.",
            "Soy lento para confiar en los miembros de otras razas, tribus y sociedades."
        ])
    },
    {
        "index": "entretenedor",
        "name": "Entretenedor",
        "description": "Vives y mueres con los aplausos de las multitudes. Sabes cómo cautivarlos, ya sea a través de tu música, tu danza, tu actuación o algún otro arte.",
        "skill_proficiencies": json.dumps(["Acrobacias", "Interpretación"]),
        "tool_proficiencies": json.dumps(["Herramientas de disfraz", "Un tipo de instrumento musical"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Un instrumento musical (de tu elección)",
            "El favor de un admirador (carta de amor, mechón de cabello o una baratija)",
            "Un conjunto de ropa de espectáculo",
            "15 po"
        ]),
        "feature_name": "Por Aclamación Popular",
        "feature_desc": "Puedes siempre encontrar un lugar para actuar, ya sea una taberna, una sala de fiestas de un noble, o un circo itinerante. En esos lugares recibirás alojamiento y comida de calidad modesta o cómoda, siempre que te pongas a actuar cada noche. Además, tu actuación te hace algo conocido en los locales: siempre y cuando no te hayas hecho enemigos, puedes recopilar rumores y noticias locales mientras interactúas con tu público.",
        "personality_traits": json.dumps([
            "Conozco un cuento o historia para cada situación.",
            "Siempre que acudo a un lugar nuevo, recojo los rumores locales y aprendo todo lo que puedo.",
            "Soy un romántico incorregible, siempre buscando a 'la persona especial'.",
            "Nadie me puede disgustar más de lo que me disgusta yo a mí mismo.",
            "Me gusta ser el centro de atención.",
            "Soy extremadamente vanidoso aunque trate de ocultarlo.",
            "He actuado para la realeza, los mendigos y todo lo que queda entre medias. Las personas son lo mismo en todas partes.",
            "Prefiero escuchar a hablar."
        ]),
        "ideals": json.dumps([
            {"desc": "Belleza. Cuando actúo, hago que el mundo sea mejor de lo que era.", "alignment": "Bueno"},
            {"desc": "Tradición. Las historias, leyendas y canciones del pasado no deben olvidarse.", "alignment": "Legal"},
            {"desc": "Creatividad. El mundo necesita nuevas ideas e innovación.", "alignment": "Caótico"},
            {"desc": "Avaricia. Estoy aquí por el dinero y la fama.", "alignment": "Malvado"},
            {"desc": "Personas. Amo a la gente. Actúo para ellos.", "alignment": "Neutral"},
            {"desc": "Honestidad. El arte debe reflejar el alma; debe venir de lo más profundo y revelar lo que hay ahí.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Mi instrumento es mi posesión más querida y me recuerda a alguien a quien amo.",
            "Alguien robó mi actuación estrella y ahora actúa en mi nombre. Tengo que recuperarla.",
            "Quiero ser famoso, cueste lo que cueste.",
            "Viví bastante tiempo en la calle y todavía me solidarizo con los pobres.",
            "Admiro a un héroe de las viejas historias y me comparo con esa persona.",
            "Sueño con actuar ante el rey o la reina algún día."
        ]),
        "flaws": json.dumps([
            "Hago a veces lo que sea para ganar fama y reconocimiento.",
            "Soy terrible con el dinero y siempre estoy endeudado.",
            "Soy demasiado crítico con la actuación de los demás.",
            "No puedo mantener un secreto para salvar mi vida o la vida de nadie.",
            "Con el fin de obtener lo que quiero, digo lo que la gente quiere oír.",
            "No puedo evitar coleccionarlos recuerdos de cada actuación."
        ])
    },
    {
        "index": "forastero",
        "name": "Forastero",
        "description": "Has crecido en lo salvaje, lejos de la civilización. Animales de caza, y sobrevivir en la naturaleza son actos de segunda naturaleza para ti.",
        "skill_proficiencies": json.dumps(["Atletismo", "Supervivencia"]),
        "tool_proficiencies": json.dumps(["Un tipo de instrumento musical", "Herramientas de navegante"]),
        "languages": json.dumps(["Un idioma de tu elección"]),
        "equipment": json.dumps([
            "Un bastón",
            "Una trampa de caza",
            "Un trofeo de un animal que hayas matado",
            "Un conjunto de ropa de viajero",
            "Bolsa con 10 po"
        ]),
        "feature_name": "Andariego",
        "feature_desc": "No importa donde estés, puedes encontrar comida y agua dulce para ti mismo y hasta cinco personas más cada día, siempre que la tierra ofrezca bayas, caza menor, agua, etc. Además, puedes identificar de memoria la geografía de una región donde hayas pasado al menos un mes.",
        "personality_traits": json.dumps([
            "Estoy endurecido por la vida en la naturaleza. Pero tengo debilidad por los animales.",
            "He pasado tanto tiempo por mi cuenta que me resulta difícil confiar en la multitud.",
            "No olvido el olor de un enemigo.",
            "Me gano la vida con mis propias manos.",
            "Soy tranquilo y estoico incluso en situaciones difíciles.",
            "Soy sospechoso con la civilización urbana.",
            "Soy impaciente con todo lo que no tiene que ver con la naturaleza.",
            "Me siento más cómodo entre animales y naturaleza que con personas."
        ]),
        "ideals": json.dumps([
            {"desc": "Cambio. La vida es como las estaciones, en constante cambio, y debemos cambiar con ella.", "alignment": "Caótico"},
            {"desc": "Mayor Bien. Es responsabilidad de todos los seres civilizados fortalecer los lazos de comunidad y las redes de cooperación.", "alignment": "Bueno"},
            {"desc": "Honor. Si deshonro a mi clan, no tengo nada.", "alignment": "Legal"},
            {"desc": "Poder de la Naturaleza. El mundo natural, no las instituciones fabricadas por el hombre, es lo que más importa.", "alignment": "Neutral"},
            {"desc": "Gloria. Debo ganarme la gloria en la batalla en honor a mi clan.", "alignment": "Cualquiera"},
            {"desc": "Vida y Muerte. La muerte es una parte natural de la vida. Debemos vivir de acuerdo con ello.", "alignment": "Neutral"}
        ]),
        "bonds": json.dumps([
            "Mi familia, clan o tribu es lo más importante para mí, incluso cuando estamos separados.",
            "Un evento importante me marcó para siempre y me empujó a viajar.",
            "Sufrí una herida terrible, y ahora busco vengarme del monstruo que me la infligió.",
            "El gran espíritu que me habló en mi viaje iniciático me envió para que cumpliese una misión.",
            "Estoy enamorado de la heredera de un noble de las tierras civilizadas.",
            "Vine a la civilización para buscar un héroe legendario que era de mi tierra."
        ]),
        "flaws": json.dumps([
            "La pompa y circunstancia de los gobernantes y señores me pone los nervios de punta.",
            "No tengo paciencia con quienes creen que son superiores a la naturaleza o a mí.",
            "No confío fácilmente en la gente de la ciudad.",
            "Soy lento en confiar en los miembros de otras razas o tribus.",
            "La violencia es mi respuesta a casi cualquier desafío.",
            "No cedo en situaciones de conflicto. El honor es lo primero."
        ])
    },
    {
        "index": "heroe-del-pueblo",
        "name": "Héroe del Pueblo",
        "description": "Vienes de la gente común, pero estás destinado a algo mucho más grande. Aún no sabes a qué, pero la gente de tu pasado podría haberlo visto venir.",
        "skill_proficiencies": json.dumps(["Trato con Animales", "Supervivencia"]),
        "tool_proficiencies": json.dumps(["Un tipo de herramientas de artesano", "Vehículos (terrestres)"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Un conjunto de herramientas de artesano (una de tu elección)",
            "Una pala",
            "Un cubo de hierro",
            "Un conjunto de ropa común",
            "Bolsa con 10 po"
        ]),
        "feature_name": "Hospitalidad Rústica",
        "feature_desc": "Como las personas comunes te respetan, puedes encontrar un lugar para esconderte, descansar o recuperarte entre la gente de las clases bajas, a menos que hayas demostrado ser un peligro para ellos. Ellos protegerán tu identidad frente a los aristócratas o aquellos que busquen perjudicarte, aunque no arriesgarán sus vidas por ti.",
        "personality_traits": json.dumps([
            "Juzgo a la gente por sus acciones, no por sus palabras.",
            "Si alguien está en dificultades, siempre estoy listo para prestar ayuda.",
            "Cuando tomo una decisión, me quedo con ella.",
            "Tengo un fuerte sentido del bien y el mal.",
            "No confío en las personas de alta alcurnia.",
            "Siempre trato de encontrar el mejor en las personas.",
            "Me resulta difícil moverme en la sociedad sin decir lo que pienso.",
            "Tengo un punto de vista particular y nadie me va a cambiar."
        ]),
        "ideals": json.dumps([
            {"desc": "Respeto. Las personas merecen ser tratadas con dignidad y respeto.", "alignment": "Bueno"},
            {"desc": "Equidad. Nadie debería recibir tratamiento preferencial ante la ley, y nadie está por encima de la ley.", "alignment": "Legal"},
            {"desc": "Libertad. Los tiranos no deben aplastar a los inocentes.", "alignment": "Caótico"},
            {"desc": "Poder. Si me convierto en fuerte, podré tomar lo que quiero.", "alignment": "Malvado"},
            {"desc": "Sinceridad. No hay bien en pretender ser algo que no eres.", "alignment": "Neutral"},
            {"desc": "Destino. Nada ni nadie puede apartarme de mi destino superior.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "El tirano que gobierna mi tierra destruirá todo lo que amo si no se le detiene.",
            "Hay una leyenda en mi pueblo sobre un héroe y sueño con seguir sus pasos.",
            "Protejo a los que no pueden protegerse a sí mismos.",
            "Regresaré a mi pueblo algún día para vivir mis días en paz.",
            "Tengo una familia en el pueblo que confía en mí para regresar.",
            "Quien me acogió cuando era un niño merece toda mi lealtad."
        ]),
        "flaws": json.dumps([
            "El tirano que gobierna mi tierra tiene mi familia en sus manos.",
            "Soy totalmente incapaz de ocultar mis sentimientos.",
            "Me resulta difícil confiar en nadie a quien no conozca de antes.",
            "Tengo una debilidad: alcohol, juego o algo parecido.",
            "Secretamente creo que las cosas serían mejores si yo estuviera al mando.",
            "Me resulta difícil resistirme a los deseos de quienes yo respeto."
        ])
    },
    {
        "index": "gremio-artesanal",
        "name": "Gremio Artesanal",
        "description": "Eres un miembro experto de un gremio de artesanos y estás bien relacionado en la comunidad mercantil. Como resultado, la gente te tiene en alta estima y te respeta.",
        "skill_proficiencies": json.dumps(["Perspicacia", "Persuasión"]),
        "tool_proficiencies": json.dumps(["Un tipo de herramientas de artesano"]),
        "languages": json.dumps(["Un idioma de tu elección"]),
        "equipment": json.dumps([
            "Un conjunto de herramientas de artesano para el oficio elegido",
            "Una carta de presentación de tu gremio",
            "Un conjunto de ropa de viajero",
            "Bolsa con 15 po"
        ]),
        "feature_name": "Membresía al Gremio",
        "feature_desc": "Como miembro establecido y respetado de un gremio, puedes contar con el apoyo de tus colegas gremiales. Tu gremio te prestará alojamiento y comida si es necesario, y pagará por tu entierro decente si mueres. En algunas ciudades y en la mayoría de los pueblos, una casa de gremio ofrece un lugar central donde reunirse con otros miembros.",
        "personality_traits": json.dumps([
            "Creo que todo problema tiene una solución práctica.",
            "Trabajo duro y en mis horas de recreo disfruto al máximo.",
            "Mi gremio es mi familia. Los protejo y ellos me protegen a mí.",
            "No confío en nadie fácilmente, pero cuando lo hago, es para siempre.",
            "Tengo un gran sentido del orgullo profesional.",
            "Soy muy meticuloso con mi trabajo.",
            "Soy bastante torpe en situaciones sociales.",
            "Me gusta aprender de los maestros de mi oficio."
        ]),
        "ideals": json.dumps([
            {"desc": "Comunidad. Es el deber de toda persona civilizada fortalecer los lazos de la comunidad.", "alignment": "Legal"},
            {"desc": "Generosidad. Mis talentos fueron un don, así que los uso en beneficio del mundo.", "alignment": "Bueno"},
            {"desc": "Libertad. Todos deben ser libres de perseguir su propio modo de vida.", "alignment": "Caótico"},
            {"desc": "Avaricia. Solo estoy en esto por el dinero.", "alignment": "Malvado"},
            {"desc": "Personas. Me decanto por trabajar con las personas en las que puedo confiar.", "alignment": "Neutral"},
            {"desc": "Aspiración. Trabajo duro para ser el mejor en mi oficio.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "El taller donde aprendí mi oficio es el lugar más importante del mundo para mí.",
            "Creé una obra maestra que fue robada de mí y debo recuperarla.",
            "Algún día regresaré a mi gremio y demostraré que soy el mejor en lo que hago.",
            "Defenderé a mi gremio a cualquier costa.",
            "Haré cualquier cosa para proteger los secretos de mi oficio.",
            "Debo demostrar que soy digno de representar a mi gremio."
        ]),
        "flaws": json.dumps([
            "Nunca pago cuando puedo obtener algo gratis.",
            "Hago demasiado hincapié en la calidad del trabajo y tiendo a criticar a los demás.",
            "Soy demasiado orgulloso y me cuesta pedir ayuda.",
            "El dinero y el poder me corromperán si no tengo cuidado.",
            "Soy incapaz de guardar un secreto.",
            "A veces me olvido de considerar los sentimientos de los demás."
        ])
    },
    {
        "index": "eremita",
        "name": "Eremita",
        "description": "Viviste aislado del resto de la sociedad durante algún tiempo. Quizás estuviste meditando en la naturaleza, o estudiando en un monasterio, o simplemente huyendo de la sociedad.",
        "skill_proficiencies": json.dumps(["Medicina", "Religión"]),
        "tool_proficiencies": json.dumps(["Herramientas de herborista"]),
        "languages": json.dumps(["Un idioma de tu elección"]),
        "equipment": json.dumps([
            "Un estuche de pergamino con notas de tus estudios o plegarias",
            "Una manta de invierno",
            "Un conjunto de ropa común",
            "Un kit de herborista",
            "5 po"
        ]),
        "feature_name": "Descubrimiento",
        "feature_desc": "Tu reclusión tranquila dio lugar a un único y poderoso descubrimiento. La naturaleza exacta de esta revelación depende de la naturaleza de tu reclusión. Podría ser una gran verdad sobre el cosmos, los dioses, los seres poderosos de los planos exteriores, o las fuerzas del bien y el mal.",
        "personality_traits": json.dumps([
            "Me he enamorado de la soledad y me resulta difícil estar entre la gente.",
            "Conecto los eventos actuales a los ciclos más amplios de la historia.",
            "Mi aislamiento me ha dado una perspectiva única pero extraña.",
            "Ignoro la moda, las noticias y todo lo que no sea esencial.",
            "Soy tranquilo, incluso ante la catástrofe.",
            "Trabajo pacientemente sin importar las circunstancias.",
            "Tengo una serie de reglas por las que vivo y que nunca violo.",
            "Olvido que la gente normal no tiene mi mismo nivel de conocimiento."
        ]),
        "ideals": json.dumps([
            {"desc": "Mayor Bien. Mi dones me fueron dados para que los use en beneficio del mundo.", "alignment": "Bueno"},
            {"desc": "Lógica. Las emociones no deben nublar nuestro pensamiento lógico.", "alignment": "Legal"},
            {"desc": "Libre Pensamiento. La investigación y el cuestionamiento deben ser libres.", "alignment": "Caótico"},
            {"desc": "Poder. El saber es poder, y el poder no debe compartirse.", "alignment": "Malvado"},
            {"desc": "Autoconocimiento. Si te conoces a ti mismo, podrás conocer el mundo.", "alignment": "Neutral"},
            {"desc": "Trascendencia. Busco elevarme más allá del mundo mundano.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Nada es más importante que los demás miembros de mi ermita o convento.",
            "Dejo mi lugar de reclusión para buscar el mal que destruiría mi vida de paz.",
            "Mi aislamiento estuvo causado por un trauma que no puedo olvidar.",
            "Busco responder a una pregunta que me persiguió durante toda mi reclusión.",
            "Un mentor me formó y me empujó a comenzar mis aventuras.",
            "Cuando regrese a mi ermita, debo demostrar que el mundo exterior valió la pena."
        ]),
        "flaws": json.dumps([
            "Ahora que he regresado al mundo, me cuesta que no todo gire en torno a mí.",
            "Guardo un secreto oscuro que podría arruinar mi reputación.",
            "Huyo de la responsabilidad de mis acciones.",
            "Tiendo a predicar y dar sermones a los demás.",
            "Me resulta difícil confiar en alguien.",
            "Soy demasiado rígido en mis creencias y no acepto el cambio fácilmente."
        ])
    },
    {
        "index": "noble",
        "name": "Noble",
        "description": "Entiendes las riquezas, el poder y el privilegio. Llevas un título noble, y tu familia es propietaria de tierras, recauda impuestos y ejerce influencia política.",
        "skill_proficiencies": json.dumps(["Historia", "Persuasión"]),
        "tool_proficiencies": json.dumps(["Un tipo de herramientas de juego"]),
        "languages": json.dumps(["Un idioma de tu elección"]),
        "equipment": json.dumps([
            "Un conjunto de ropa fina",
            "Un anillo con sello",
            "Un pergamino de pedigrí",
            "Bolsa con 25 po"
        ]),
        "feature_name": "Posición de Privilegio",
        "feature_desc": "Gracias a tu noble cuna, la gente está inclinada a pensar lo mejor de ti. Eres bienvenido en la alta sociedad, y la gente asume que tienes el derecho de estar donde estés. La gente común hace todo lo posible para acomodarte y evitar tu desagrado, y otra gente de alta cuna te trata como a un igual.",
        "personality_traits": json.dumps([
            "Mi elocuencia y mis modales fascinan a todos los que me rodean.",
            "Me esfuerzo por mantener la dignidad en toda situación, aun en el combate.",
            "Me resulta difícil resistir una apuesta o un reto.",
            "Me rodeo de gente que puede ser de utilidad para mí.",
            "Me cuesta recordar que no todos son de mi posición social.",
            "Soy paciente y amable con los que están bajo mi cuidado.",
            "Cambio mis lealtades tan pronto como el viento cambia.",
            "Tiendo a menospreciar a los que no son de mi clase."
        ]),
        "ideals": json.dumps([
            {"desc": "Respeto. El respeto se debe a mí porque soy un noble.", "alignment": "Malvado"},
            {"desc": "Responsabilidad. Es mi deber respetar la autoridad de aquellos que están por encima de mí.", "alignment": "Legal"},
            {"desc": "Independencia. Debo demostrar que puedo controlar mi propio destino.", "alignment": "Caótico"},
            {"desc": "Poder. Si puedo alcanzar suficiente poder, nadie me dirá lo que tengo que hacer.", "alignment": "Malvado"},
            {"desc": "Familia. La sangre vence a todo.", "alignment": "Cualquiera"},
            {"desc": "Noble Obligación. Es mi deber proteger y cuidar a los que están bajo mi señorío.", "alignment": "Bueno"}
        ]),
        "bonds": json.dumps([
            "Voy a dedicar mi vida a proteger a los habitantes de mi tierra.",
            "Mi casa me avergonzó una vez. Debo restaurar su honor.",
            "Mis aliados me rechazaron pero yo todavía los sirvo en secreto.",
            "Algún día tomaré mi venganza en la familia corrupta que me arrebató mi legítimo puesto.",
            "Mi alianza con mi familia determina mis lealtades.",
            "Nada es más importante para mí que los otros miembros de mi familia."
        ]),
        "flaws": json.dumps([
            "Secretamente creo que todo el mundo es inferior a mí.",
            "Oculto un escándalo vergonzoso que podría arruinarme.",
            "Suelo hablar sin pensar, hiriendo a personas con las que me importaría llevarme bien.",
            "No puedo resistirme a un reto de duelo de ingenio.",
            "Me resulta difícil confiar en nadie que no sea de noble cuna.",
            "A veces doy demasiado crédito a lo que mi posición puede conseguir."
        ])
    },
    {
        "index": "sabio",
        "name": "Sabio",
        "description": "Has pasado años aprendiendo el funcionamiento del multiverso. Has consultado documentos, estudiado pergaminos e incluso escuchado a los seres más sabios que querían compartir su información contigo.",
        "skill_proficiencies": json.dumps(["Arcanos", "Historia"]),
        "tool_proficiencies": json.dumps([]),
        "languages": json.dumps(["Dos idiomas de tu elección"]),
        "equipment": json.dumps([
            "Una botella de tinta negra",
            "Una pluma",
            "Un pequeño cuchillo",
            "Una carta de un colega fallecido planteando preguntas que no puedes responder",
            "Un conjunto de ropa común",
            "Bolsa con 10 po"
        ]),
        "feature_name": "Investigador",
        "feature_desc": "Cuando intentas aprender o recordar un dato o hecho, si no conoces esa información, a menudo sabes dónde y de quién puedes obtenerla. Por lo general, esta información proviene de una biblioteca, scriptorium, universidad u otro tipo de académico, aunque puede que requiera que encuentres a un brujo en lo más profundo del bosque o incluso al líder de una secta diabólica.",
        "personality_traits": json.dumps([
            "Uso palabras largas y complicadas para demostrar mi inteligencia.",
            "He leído todo el material de la biblioteca de la universidad y me aburro con facilidad.",
            "Me deleito con el debate y el análisis intelectual.",
            "Un libro sin terminar o un pergamino con preguntas sin resolver es la peor tortura para mí.",
            "Recito hechos obscuros constantemente durante las conversaciones.",
            "Soy muy serio cuando estoy inmerso en un misterio.",
            "Olvido mi apariencia porque estoy absorto en mis pensamientos.",
            "No me importa mi bienestar personal si hay algo interesante que estudiar."
        ]),
        "ideals": json.dumps([
            {"desc": "Conocimiento. El conocimiento es el fin último; el poder es secundario.", "alignment": "Neutral"},
            {"desc": "Belleza. Lo que es bello me apunta a lo que es verdadero.", "alignment": "Bueno"},
            {"desc": "Lógica. Las emociones no deben nublar nuestro pensamiento lógico.", "alignment": "Legal"},
            {"desc": "Sin Límites. Nada debe detener la búsqueda del conocimiento.", "alignment": "Caótico"},
            {"desc": "Poder. El conocimiento es el camino al poder y a la dominación.", "alignment": "Malvado"},
            {"desc": "Autodesarrollo. El objetivo de una vida de estudio es el perfeccionamiento personal.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Es mi deber proteger a mis estudiantes de los peligros del mundo.",
            "Tengo un antiguo tomo que contiene los secretos del conocimiento arcano.",
            "Trabajé incansablemente para conseguir un puesto de académico y no voy a dejarlo ir.",
            "He perdido algo importante en la persecución de mis estudios y debo recuperarlo.",
            "Mi trabajo intelectual es el legado con el que quiero ser recordado.",
            "Debo demostrar que las teorías de mi antiguo mentor eran correctas."
        ]),
        "flaws": json.dumps([
            "Me resulta difícil relacionarme con personas que no comparten mis intereses intelectuales.",
            "Desconfío de la magia divina y tiendo a ver a los clérigos como supersticiosos.",
            "Desvelo los secretos de los demás sin que me importen sus sentimientos.",
            "Soy inflexible en mis creencias y me niego a cambiar de opinión ante cualquier evidencia.",
            "Hablo en exceso sobre cosas que la mayoría de la gente no entiende.",
            "Soy incapaz de mantener un secreto."
        ])
    },
    {
        "index": "marinero",
        "name": "Marinero",
        "description": "Has pasado años en el mar, ya sea en barcos mercantes, buques de guerra o incluso en barcos piratas. Las travesías en el mar te han endurecido y te has convertido en alguien muy curtido.",
        "skill_proficiencies": json.dumps(["Atletismo", "Percepción"]),
        "tool_proficiencies": json.dumps(["Herramientas de navegante", "Vehículos (acuáticos)"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Un belaypin (que puede utilizarse como maza)",
            "50 pies de seda",
            "Un amuleto de buena fortuna",
            "Un conjunto de ropa común",
            "Bolsa con 10 po"
        ]),
        "feature_name": "Pasaje Seguro",
        "feature_desc": "Cuando lo necesites, puedes conseguir pasaje gratuito en un barco de vela para ti y tus compañeros de aventuras. Puedes navegar en un barco mercante, un barco de guerra u otro barco similar. Como mínimo, encontrarás un pasaje en la cubierta inferior, aunque quizás tengas que trabajar a bordo.",
        "personality_traits": json.dumps([
            "Mis insultos son tan agudos como mi espada.",
            "Soy increíblemente supersticioso y veo malos presagios en todo.",
            "Tengo siempre una historia del mar para cualquier situación.",
            "Comparto lo que tengo con mis compañeros de tripulación.",
            "Me siento más libre en el mar que en tierra firme.",
            "Siempre trato de mantener la disciplina y el orden.",
            "Jamás me desvío del camino que me marco.",
            "La vida en el mar me ha enseñado a ser práctico y directo."
        ]),
        "ideals": json.dumps([
            {"desc": "Respeto. Lo que mantiene al barco unido es el respeto entre los marineros.", "alignment": "Legal"},
            {"desc": "Equidad. Todos trabajamos juntos para sobrevivir en el mar.", "alignment": "Bueno"},
            {"desc": "Libertad. El mar es la libertad, y yo soy libre.", "alignment": "Caótico"},
            {"desc": "Dominación. Me convertiré en el capitán del barco más poderoso.", "alignment": "Malvado"},
            {"desc": "Personas. Soy leal a la tripulación, no a los ideales.", "alignment": "Neutral"},
            {"desc": "Aspiración. Algún día seré el capitán de mi propio barco.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Soy leal a mi capitán sobre todo lo demás.",
            "El mar representa libertad y aventura para mí.",
            "Fui maldecido por un espíritu marino y busco romper ese maldición.",
            "Mi antigua tripulación me entregó a las autoridades. Busco vengarme.",
            "Tengo una familia en tierra que confía en mí para regresar.",
            "Un monstruo del mar mató a alguien querido para mí y busco venganza."
        ]),
        "flaws": json.dumps([
            "Sigo las órdenes aunque vayan en contra de mi moralidad.",
            "Digo lo que pienso sin considerar las consecuencias.",
            "Tengo debilidad por el ron y el juego.",
            "A menudo me meto en riñas innecesarias.",
            "No confío en alguien que no haya pasado tiempo en el mar.",
            "Soy inflexible y no acepto ideas que van en contra de mi experiencia."
        ])
    },
    {
        "index": "soldado",
        "name": "Soldado",
        "description": "La guerra ha sido tu profesión desde que eras joven. Sirviste en un ejército y aprendiste no solo cómo sobrevivir en la batalla, sino también cómo ser un líder.",
        "skill_proficiencies": json.dumps(["Atletismo", "Intimidación"]),
        "tool_proficiencies": json.dumps(["Un tipo de herramientas de juego", "Vehículos (terrestres)"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Una insignia de tu rango",
            "Un trofeo tomado de un enemigo caído (daga, espada rota o estandarte)",
            "Un conjunto de dados de hueso o baraja de naipes",
            "Un conjunto de ropa común",
            "Bolsa con 10 po"
        ]),
        "feature_name": "Rango Militar",
        "feature_desc": "Tienes un rango militar de tu carrera como soldado. Los soldados leales a tu antigua organización militar todavía reconocen tu autoridad e influencia, y te deferirán si son de un rango inferior. Puedes invocar tu rango para ejercer influencia sobre otros soldados.",
        "personality_traits": json.dumps([
            "Siempre soy educado y respetuoso.",
            "Soy perseguido por memorias de guerra. Lucho para ocultar estas pesadillas.",
            "He perdido demasiados amigos y me resulta difícil hacer nuevos.",
            "Soy un compañero de armas leal: nunca abandono a un amigo.",
            "Obedezco la ley, incluso si la ley causa sufrimiento.",
            "La primera vez que vi que un niño lloraba de hambre, supe que tenía que cambiar el mundo.",
            "El peor insulto que existe es decir que alguien no es honorable.",
            "Los que luchan junto a mí merecen mi máxima lealtad y respeto."
        ]),
        "ideals": json.dumps([
            {"desc": "Bien Mayor. Nuestro destino es dar nuestras vidas en servicio del bien mayor.", "alignment": "Bueno"},
            {"desc": "Responsabilidad. Hago lo que debo y obedezco a mi autoridad justa.", "alignment": "Legal"},
            {"desc": "Independencia. Cuando la gente sigue órdenes ciegamente, se convierten en parte del problema.", "alignment": "Caótico"},
            {"desc": "Fuerza. En la vida, los fuertes se imponen a los débiles.", "alignment": "Malvado"},
            {"desc": "Viva y Deja Vivir. Los ideales no son suficientes razón para luchar.", "alignment": "Neutral"},
            {"desc": "Nación. Mi ciudad, nación o mi pueblo son los que más me importan.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Todavía estoy buscando la unidad a la que pertenecía antes.",
            "Alguien salvó mi vida en el campo de batalla. Nunca lo olvidaré.",
            "Mi honor es mi vida. Nunca dejaré que nadie le ponga en duda.",
            "Nunca me perdono por haber abandonado la causa cuando los demás necesitaban de mí.",
            "Aquellos que luchan a mi lado son los únicos en quienes confío.",
            "Lucho por aquellos que no pueden luchar por sí mismos."
        ]),
        "flaws": json.dumps([
            "El monstruo apareció durante la batalla y sigue apareciendo en mis sueños.",
            "Hay algo oscuro en mi pasado que me avergüenza.",
            "Odio las demoras y la inacción.",
            "Cuando las personas mencionan a un comandante o general específico, noto que me tensa.",
            "Sigo mis órdenes incluso cuando es obvio que están equivocadas.",
            "Me resulta difícil relacionarme con las personas fuera del campo de batalla."
        ])
    },
    {
        "index": "vagabundo",
        "name": "Vagabundo",
        "description": "Creciste en las calles de una ciudad, solo y sin recursos. No tenías familia ni nadie que te cuidara, así que aprendiste a cuidarte solo. Luchaste a diario para conseguir comida y refugio.",
        "skill_proficiencies": json.dumps(["Juego de Manos", "Sigilo"]),
        "tool_proficiencies": json.dumps(["Herramientas de disfraz", "Herramientas de ladrón"]),
        "languages": json.dumps([]),
        "equipment": json.dumps([
            "Un pequeño cuchillo",
            "Un mapa de la ciudad en la que creciste",
            "Un ratón mascota",
            "Un recuerdo de tus padres",
            "Un conjunto de ropa común",
            "10 po"
        ]),
        "feature_name": "Conocedor de la Ciudad",
        "feature_desc": "Conoces los secretos de la ciudad como la palma de tu mano. Puedes encontrar un lugar para esconderte, descansar o recuperarte en una ciudad o pueblo, así como obtener información de los rumores de la calle. Puedes también encontrar información sobre los movimientos y las actividades de cualquier persona en la ciudad.",
        "personality_traits": json.dumps([
            "Escondo comida y riqueza, nunca sabiendo cuándo tendré que huir.",
            "Hago amigos con facilidad pero no confío fácilmente en ellos.",
            "Soy increíblemente terco y nunca admito que estoy equivocado.",
            "Soy duro de corazón y tomo todo lo que puedo.",
            "Me muevo silenciosamente incluso en los sitios más peligrosos.",
            "Siempre mantengo la guardia alta.",
            "Soy muy inteligente y rápido de reflejos.",
            "Tengo una familia que elegí yo mismo y la protejo con mi vida."
        ]),
        "ideals": json.dumps([
            {"desc": "Respeto. Todos merecen ser tratados con dignidad, sin importar la posición.", "alignment": "Bueno"},
            {"desc": "Comunidad. Debemos cuidar los unos de los otros porque nadie más lo hará.", "alignment": "Legal"},
            {"desc": "Cambio. Las injusticias del presente serán las injusticias del futuro.", "alignment": "Caótico"},
            {"desc": "Retribución. Los ricos tienen que pagar.", "alignment": "Malvado"},
            {"desc": "Personas. Ayudo a los que me ayudan, y ese es el final.", "alignment": "Neutral"},
            {"desc": "Aspiración. Voy a subir más alto que cualquier cosa de la que provengo.", "alignment": "Cualquiera"}
        ]),
        "bonds": json.dumps([
            "Mi ciudad natal es la más importante del mundo para mí.",
            "Debo mantenerme seguro a cualquier precio para que alguien que depende de mí pueda seguir contando conmigo.",
            "Regresaré al barrio donde crecí y demostraré que tengo éxito.",
            "Nadie más debería tener que pasar lo que yo pasé.",
            "Tengo una deuda de vida con alguien que me ayudó cuando era niño.",
            "Mi amor más preciado es que un día podré hacer que el mundo sea mejor para los niños de la calle."
        ]),
        "flaws": json.dumps([
            "Guardo rencores durante mucho tiempo.",
            "Soy increíblemente envidioso de aquellos que tienen lo que yo no tuve.",
            "Tengo miedo a la riqueza que alguna vez no pude alcanzar.",
            "No confío en los miembros de la nobleza y me resulta difícil tratarlos con respeto.",
            "Tengo debilidad por el juego y el robo.",
            "Mis lealtades son inconstantes porque me han traicionado antes."
        ])
    }
]


def clean_bg_index(s: str) -> str:
    import unicodedata
    import re
    # strip accents, convert to lower, replace space and underscore with hyphen
    s = "".join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9\s_-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    return s.strip('-')

def patch_backgrounds(db_session):
    """Actualiza o crea todos los trasfondos en la base de datos."""
    from models import Background, Character
    import json
    
    def get_bg_score(bg):
        score = 0
        for attr in ["personality_traits", "ideals", "bonds", "flaws"]:
            val = getattr(bg, attr, "[]") or "[]"
            try:
                lst = json.loads(val)
                if isinstance(lst, list) and len(lst) > 0:
                    score += len(lst)
            except Exception:
                pass
        return score
    
    # 1. Deduplicación de trasfondos existentes
    all_bgs = db_session.query(Background).all()
    grouped = {}
    for bg in all_bgs:
        norm = clean_bg_index(bg.index or bg.name or "")
        if norm:
            grouped[norm] = grouped.get(norm, []) + [bg]
            
    duplicates_removed = 0
    characters_remapped = 0
    
    for norm_index, bgs in grouped.items():
        if len(bgs) > 1:
            # REGLA DE PURGA ESTRICTA: Ordenar por completitud descendente para mantener la versión modular,
            # y por ID ascendente en caso de empate.
            bgs.sort(key=lambda x: (-get_bg_score(x), x.id))
            kept = bgs[0]
            dups = bgs[1:]
            
            # Asegurar que el que se mantiene tenga el index normalizado correcto
            kept.index = norm_index
            
            for dup in dups:
                # Buscar personajes asociados al duplicado y remapearlos
                chars_to_update = db_session.query(Character).filter(Character.background_id == dup.id).all()
                for char in chars_to_update:
                    char.background_id = kept.id
                    characters_remapped += 1
                
                # Eliminar el duplicado
                db_session.delete(dup)
                duplicates_removed += 1
                
    db_session.commit()
    
    # 2. Seeding / actualización de los trasfondos oficiales
    patched = 0
    created = 0
    
    for bg_data in BACKGROUNDS_DATA:
        norm_idx = clean_bg_index(bg_data["index"])
        
        # Buscar por el index normalizado para evitar duplicados
        existing = db_session.query(Background).filter(
            (Background.index == bg_data["index"]) | 
            (Background.index == norm_idx)
        ).first()
        
        # Sobrescribir con el index limpio normalizado
        bg_data_copy = dict(bg_data)
        bg_data_copy["index"] = norm_idx
        
        if existing:
            for key, value in bg_data_copy.items():
                setattr(existing, key, value)
            patched += 1
        else:
            new_bg = Background(**bg_data_copy)
            db_session.add(new_bg)
            created += 1
            
    db_session.commit()
    return {
        "patched": patched,
        "created": created,
        "total": len(BACKGROUNDS_DATA),
        "duplicates_removed": duplicates_removed,
        "characters_remapped": characters_remapped
    }


if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from database import SessionLocal
    db = SessionLocal()
    try:
        result = patch_backgrounds(db)
        print(f"Trasfondos actualizados: {result}")
    finally:
        db.close()
