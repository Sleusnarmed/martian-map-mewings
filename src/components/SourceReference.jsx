import { sourceRecord } from './sourceRecords.js'
import './source-reference.css'

export default function SourceReference({ source, children = 'Source reference', citation }) {
  const record = sourceRecord(source)
  return <details className="source-reference">
    <summary>{children}</summary>
    <div className="source-reference-record">
      <strong>{record.title}</strong>
      <p>{record.publisher}</p>
      <p>{citation || record.reference}</p>
      {record.product && <code>{record.product}</code>}
    </div>
  </details>
}
