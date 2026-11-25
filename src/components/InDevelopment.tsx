import { Link } from 'react-router';
import { usePageTitle } from '../lib/usePageTitle';
import { Notice } from './Notice';

interface InDevelopmentProps {
  title: string;
  intro: string;
  /** What this section will offer once built. */
  plannedCapabilities: string[];
  /** Delivery phase reference from docs/PRODUCT_ROADMAP.md. */
  phase: string;
}

/**
 * Honest placeholder for a section that is not built yet. It states clearly that
 * the feature is unavailable instead of showing controls that do nothing.
 */
export function InDevelopment({ title, intro, plannedCapabilities, phase }: InDevelopmentProps) {
  usePageTitle(title);
  return (
    <div className="container prose">
      <h1>{title}</h1>
      <p className="lead">{intro}</p>
      <Notice title="Not available yet">
        <p>
          This section is being built ({phase}). No listings are shown here yet, and nothing on this
          page should be taken as a real opportunity.
        </p>
      </Notice>
      <h2>What you will be able to do here</h2>
      <ul>
        {plannedCapabilities.map((capability) => (
          <li key={capability}>{capability}</li>
        ))}
      </ul>
      <p>
        <Link to="/about">Learn more about RISE NETWORK</Link>
      </p>
    </div>
  );
}
