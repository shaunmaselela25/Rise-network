import { Link, useSearchParams } from 'react-router';
import { LoadError, Loading } from '../../components/AsyncStates';
import { FormStatus } from '../../components/form/FormStatus';
import styles from '../../components/Listing.module.css';
import { listAllCareers } from '../careers/api';
import { topicLabels } from '../careers/labels';
import { formatTimestamp } from '../../lib/dates';
import { useData } from '../../lib/errors';
import { usePageTitle } from '../../lib/usePageTitle';
import { listAllLearning } from '../learning/api';
import { costLabels, resourceStatusLabels, type ResourceStatus } from '../learning/labels';

interface Row {
  id: string;
  title: string;
  status: ResourceStatus;
  detail: string;
  updated_at: string;
}

const config = {
  learning: {
    title: 'Learning resources',
    newLabel: 'Add a learning resource',
    load: async (): Promise<Row[]> =>
      (await listAllLearning()).map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        detail: `${r.provider_name} · ${costLabels[r.cost]}`,
        updated_at: r.updated_at,
      })),
  },
  careers: {
    title: 'Career guides',
    newLabel: 'Add a career guide',
    load: async (): Promise<Row[]> =>
      (await listAllCareers()).map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        detail: topicLabels[r.topic],
        updated_at: r.updated_at,
      })),
  },
} as const;

export function ManageListPage({ kind }: { kind: keyof typeof config }) {
  const { title, newLabel, load } = config[kind];
  usePageTitle(title);
  const [searchParams] = useSearchParams();
  const result = useData(load, kind);

  return (
    <div className="container">
      <p>
        <Link to="/staff">← Staff</Link>
      </p>
      <h1>{title}</h1>
      {searchParams.get('saved') && (
        <FormStatus kind="success">
          <p>Saved.</p>
        </FormStatus>
      )}
      <p>
        <Link className="button button--primary" to={`/staff/${kind}/new`}>
          {newLabel}
        </Link>
      </p>
      {result.status === 'loading' && <Loading label="Loading…" />}
      {result.status === 'error' && <LoadError message={result.message} onRetry={result.reload} />}
      {result.status === 'ready' && result.data.length === 0 && (
        <div className={styles.empty}>
          <p>Nothing has been added yet.</p>
        </div>
      )}
      {result.status === 'ready' && result.data.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">{title}</caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Details</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`/staff/${kind}/${row.id}`}>{row.title}</Link>
                  </td>
                  <td>{row.detail}</td>
                  <td>{resourceStatusLabels[row.status]}</td>
                  <td>{formatTimestamp(row.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
