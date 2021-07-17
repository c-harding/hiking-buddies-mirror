module 'react-sanitized-html' {
  interface Props {
    allowProtocolRelative?: boolean;
    allowedAttributes?: Record<string, string[]>;
    allowedClasses?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowedTags?: string[];
    exclusiveFilter?: unknown;
    html: string;
    nonTextTags?: string[];
    parser?: unknown;
    selfClosing?: string[];
    transformTags?: Record<string, unknown | string>;

    className?: string;
    id?: string;
    style?: Record<string, unknown>;
  }

  export default function SanitizedHTML(props: Props): JSX.Element;
}
