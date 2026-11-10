import { Link } from "react-router-dom";

interface Props {
  terms: boolean;
  age: boolean;
  onTerms: (v: boolean) => void;
  onAge: (v: boolean) => void;
  error?: string;
  idPrefix?: string;
}

const TermsConsentFields = ({ terms, age, onTerms, onAge, error, idPrefix = "consent" }: Props) => (
  <fieldset className="space-y-3" aria-describedby={error ? `${idPrefix}-error` : undefined}>
    <legend className="sr-only">Aceites obrigatórios</legend>
    <label htmlFor={`${idPrefix}-terms`} className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer">
      <input
        id={`${idPrefix}-terms`}
        type="checkbox"
        checked={terms}
        onChange={(e) => onTerms(e.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span>
        Li e aceito os{" "}
        <Link to="/terms" target="_blank" className="text-primary underline">Termos de Uso</Link> e a{" "}
        <Link to="/privacy" target="_blank" className="text-primary underline">Política de Privacidade</Link>
      </span>
    </label>
    <label htmlFor={`${idPrefix}-age`} className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer">
      <input
        id={`${idPrefix}-age`}
        type="checkbox"
        checked={age}
        onChange={(e) => onAge(e.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span>Confirmo que tenho 13 anos ou mais. Se tenho menos de 18, declaro que tenho autorização do meu responsável legal.</span>
    </label>
    {error && <p id={`${idPrefix}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
  </fieldset>
);

export default TermsConsentFields;
