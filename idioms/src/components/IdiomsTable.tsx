import React from "react";
import { Idiom } from "../types/types.ts";

interface IdiomsTableProps {
  idioms: Idiom[];
  showAuthor?: boolean;
  showStatus?: boolean;
}

const IdiomsTable: React.FC<IdiomsTableProps> = ({ idioms, showAuthor = true, showStatus = false }) => {
  return (
    <table className="profile-table">
      <thead>
        <tr>
          <th>Idiom</th>
          <th>Meaning</th>
          <th>Example</th>
          {showAuthor && <th>Author</th>}
          {showStatus && <th>Status</th>}
        </tr>
      </thead>
      <tbody>
        {idioms.map((idiom) => (
          <tr key={idiom.id}>
            <td>{idiom.idiom}</td>
            <td>{idiom.english}</td>
            <td>{idiom.example}</td>
            {showAuthor && <td>{idiom.submittedBy}</td>}
            {showStatus && <td>{idiom.approvalStatus}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default IdiomsTable;
