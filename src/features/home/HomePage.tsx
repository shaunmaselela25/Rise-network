import { Link } from 'react-router';
import { Notice } from '../../components/Notice';
import { usePageTitle } from '../../lib/usePageTitle';
import styles from './HomePage.module.css';

const pillars = [
  {
    title: 'Opportunities',
    to: '/opportunities',
    description:
      'Bursaries, scholarships, internships, learnerships, graduate programmes, training and more — each with its source, eligibility and closing date.',
  },
  {
    title: 'Learning',
    to: '/learning',
    description:
      'Courses and skills-development resources, clearly marked as free, paid or funded, so you can plan your next step.',
  },
  {
    title: 'Careers',
    to: '/careers',
    description: 'Practical guidance on CVs, interviews, workplace readiness and career pathways.',
  },
] as const;

const principles = [
  {
    title: 'Traceable sources',
    description: 'Every listing links to the organisation that offers it.',
  },
  {
    title: 'Clear requirements',
    description: 'Eligibility, documents, costs and deadlines are shown up front.',
  },
  {
    title: 'Free to browse',
    description: 'You do not need an account to look for opportunities.',
  },
  {
    title: 'Honest about what we do',
    description:
      'We help you find opportunities; selection is always made by the provider. Be cautious of anyone who asks for payment to guarantee you a place.',
  },
] as const;

export function HomePage() {
  usePageTitle();
  return (
    <>
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className="container">
          <p className={styles.eyebrow}>Opportunity. Access. Progress.</p>
          <h1 id="hero-heading" className={styles.heading}>
            Find legitimate opportunities to learn, work and grow — all in one place.
          </h1>
          <p className={`lead ${styles.intro}`}>
            RISE NETWORK is a South African platform that helps young people discover and understand
            opportunities for education, skills development, careers and community.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary" to="/about">
              How RISE NETWORK works
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <Notice title="RISE NETWORK is in development">
          <p>
            The opportunity directory and accounts are not live yet. When they launch, listings will
            appear only after review.
          </p>
        </Notice>

        <section aria-labelledby="pillars-heading" className={styles.section}>
          <h2 id="pillars-heading">What you will find</h2>
          <ul className={styles.cards}>
            {pillars.map((pillar) => (
              <li key={pillar.to} className={styles.card}>
                <h3>
                  <Link to={pillar.to}>{pillar.title}</Link>
                </h3>
                <p>{pillar.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="principles-heading" className={styles.section}>
          <h2 id="principles-heading">Our commitments</h2>
          <ul className={styles.principles}>
            {principles.map((principle) => (
              <li key={principle.title}>
                <h3 className={styles.principleTitle}>{principle.title}</h3>
                <p>{principle.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
