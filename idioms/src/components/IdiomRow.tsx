import IdiomField from "./IdiomField";

interface IdiomRowProps {
  id: number;
  data: { id: number; idiom: string; translation: string; definition: string; example: string };
  onRowChange: (id: number, field: string, value: string) => void;
}

function IdiomRow({ id, data, onRowChange }: IdiomRowProps) {
  const handleFieldChange = (field: string, value: string) => {
    onRowChange(id, field, value);
  };

  return (
    <tr>
      <td>
        <IdiomField
          value={data.idiom}
          onChange={(value) => handleFieldChange('idiom', value)}
          required={true}
        />
      </td>
      <td>
        <IdiomField
          value={data.translation}
          onChange={(value) => handleFieldChange('translation', value)}
          required={true}
        />
      </td>
      <td>
        <IdiomField
          value={data.definition}
          onChange={(value) => handleFieldChange('definition', value)}
          required={true}
        />
      </td>
      <td>
        <IdiomField
          value={data.example}
          onChange={(value) => handleFieldChange('example', value)}
          required={false}
        />
      </td>
    </tr>
  );
}

export default IdiomRow;
