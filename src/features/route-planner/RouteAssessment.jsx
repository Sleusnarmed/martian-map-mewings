import { currentRouteAssessment } from "./routeAssessment.js";
import { formatMinutes } from "../mission-detail/missionPresentation.js";

export default function RouteAssessment({ state }) {
  const result = currentRouteAssessment(state);
  const returning = state.mode === "return";
  if (!result?.route) return null;
  const limited = result.status === "resources";
  const minimum = (seconds) => `${Math.ceil(seconds / 6) / 10} min`;
  return (
    <section className="route-assessment" aria-label="Route time and resources">
      <dl className="route-readings">
        <div>
          <dt>{returning ? "Return to A" : "Remaining outbound"}</dt>
          <dd>{formatMinutes(returning ? result.returnSeconds : result.outboundSeconds)}</dd>
        </div>
        <div>
          <dt>{returning ? "Required reserve" : "Return from B"}</dt>
          <dd>{formatMinutes(returning ? result.reserveSeconds : result.returnSeconds)}</dd>
        </div>
      </dl>
      <details open={limited || undefined}>
        <summary>
          {limited ? "Resources required to start" : "Resource requirements"}
        </summary>
        <table>
          <caption className="field-sr-only">
            Total excursion resources, including time already used
          </caption>
          <thead>
            <tr>
              <th scope="col">Resource</th>
              <th scope="col">Available now</th>
              <th scope="col">Minimum total</th>
            </tr>
          </thead>
          <tbody>
            {result.resources?.map((resource) => (
              <tr
                key={resource.id}
                className={resource.shortfallSeconds > 0 ? "is-limiting" : ""}
              >
                <th scope="row">
                  {resource.label}
                  {resource.shortfallSeconds > 0 && (
                    <small>Short by {minimum(resource.shortfallSeconds)}</small>
                  )}
                </th>
                <td>{formatMinutes(resource.availableSeconds)}</td>
                <td>{minimum(resource.minimumTotalSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {limited && (
          <p className="route-status is-warning">
            Current resources do not cover the remaining plan and reserve.
            Pause and review the route and limits.
          </p>
        )}
        <p className="route-source-note">
          Includes {formatMinutes(result.activitySeconds)} planned activity,{" "}
          {formatMinutes(result.reserveSeconds)} reserve and{" "}
          {formatMinutes(result.conservativeReturnSeconds)} conservative return
          allowance.
        </p>
      </details>
    </section>
  );
}
