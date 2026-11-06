import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";

export default function FallNichtGefunden() {
  return (
    <div className="px-4 pt-32 md:pl-[120px] md:pr-8">
      <Leer art="leer" titel="Servicefall" text="Dieser Servicefall wurde nicht gefunden – vielleicht wurde die Nummer falsch eingegeben." aktion={<Knopf href="/service/faelle">Zur Liste</Knopf>} />
    </div>
  );
}
