import { Link } from "react-router-dom";
import Section from '../Section/Section';
import {marked} from 'marked'

function Faq() {
  return (
    <div className="Faq">
      <h1 className="
        text-4xl
        font-bold
      ">
        FAQ
      </h1>

      <div className="my-5">
        <Section title="Hoe beheer ik zones?">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(`
Op de pagina **Zones** is het mogelijk om zones te beheren en bekijken.

Wil je zones toevoegen, aanpassen of verwijderen? Doe dit als volgt:

1. Ga naar [Zones](/map/zones)
2. Klik links in het menu op het potlood-icoon<br /><br />![img](https://i.imgur.com/b1ehHu5.png)<br /><br />


### Toevoegen

3. Klik op **Nieuwe zone aanmaken**
4. Klik meerdere keren op de kaart om een gebied af te definieren<br /><br />![img](https://i.imgur.com/gV2mMvl.png)<br />
5. Geef de zone een **naam**
6. Bepaal welk type zone dit is:
  - Analysezone: Definieer een zone voor toekomstige analyses
  - Parking zone: Stel een limiet aan voertuigen in
  - No parking: Maak een verbodsgebied
7. Klik op **Opslaan**

![img](https://i.imgur.com/LFY7xHt.png)

          `) }}
          />
        </Section>
      </div>

    </div>
  )
}

export default Faq;
