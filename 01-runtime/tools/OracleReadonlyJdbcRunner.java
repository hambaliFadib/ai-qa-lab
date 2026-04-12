import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.Properties;

import oracle.jdbc.OraclePreparedStatement;

public class OracleReadonlyJdbcRunner {
  public static void main(String[] args) throws Exception {
    if (args.length < 2) {
      throw new IllegalArgumentException("Usage: java OracleReadonlyJdbcRunner <query.sql> <binds.properties>");
    }

    String jdbcUrl = requiredEnv("ORACLE_JDBC_URL");
    String jdbcUser = requiredEnv("ORACLE_JDBC_USER");
    String jdbcPassword = requiredEnv("ORACLE_JDBC_PASSWORD");
    int maxRows = Integer.parseInt(System.getenv().getOrDefault("ORACLE_JDBC_MAX_ROWS", "100"));

    String sql = Files.readString(Path.of(args[0]), StandardCharsets.UTF_8);
    Properties binds = new Properties();
    Path bindsPath = Path.of(args[1]);
    if (Files.exists(bindsPath)) {
      try (var reader = Files.newBufferedReader(bindsPath, StandardCharsets.UTF_8)) {
        binds.load(reader);
      }
    }

    Class.forName("oracle.jdbc.OracleDriver");

    try (Connection connection = DriverManager.getConnection(jdbcUrl, jdbcUser, jdbcPassword)) {
      connection.setReadOnly(true);
      connection.setAutoCommit(false);

      try (OraclePreparedStatement statement = (OraclePreparedStatement) connection.prepareStatement(sql)) {
        statement.setMaxRows(maxRows);
        statement.setFetchSize(Math.min(maxRows, 200));

        for (String key : binds.stringPropertyNames()) {
          statement.setStringAtName(key, binds.getProperty(key));
        }

        try (ResultSet resultSet = statement.executeQuery()) {
          ResultSetMetaData metaData = resultSet.getMetaData();
          int columnCount = metaData.getColumnCount();
          StringBuilder json = new StringBuilder();
          json.append('{');
          json.append("\"columns\":[");
          for (int index = 1; index <= columnCount; index += 1) {
            if (index > 1) {
              json.append(',');
            }
            json.append(jsonString(metaData.getColumnLabel(index)));
          }
          json.append("],\"rows\":[");

          boolean firstRow = true;
          while (resultSet.next()) {
            if (!firstRow) {
              json.append(',');
            }
            firstRow = false;
            json.append('{');
            for (int index = 1; index <= columnCount; index += 1) {
              if (index > 1) {
                json.append(',');
              }
              json.append(jsonString(metaData.getColumnLabel(index)));
              json.append(':');
              Object value = resultSet.getObject(index);
              json.append(toJsonValue(value));
            }
            json.append('}');
          }

          json.append("]}");
          System.out.print(json.toString());
        }
      }
    }
  }

  private static String requiredEnv(String key) {
    String value = System.getenv(key);
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Missing environment variable: " + key);
    }
    return value;
  }

  private static String toJsonValue(Object value) {
    if (value == null) {
      return "null";
    }
    if (value instanceof Number || value instanceof Boolean) {
      return value.toString();
    }
    return jsonString(value.toString());
  }

  private static String jsonString(String value) {
    StringBuilder escaped = new StringBuilder();
    escaped.append('"');
    for (int index = 0; index < value.length(); index += 1) {
      char character = value.charAt(index);
      switch (character) {
        case '\\':
          escaped.append("\\\\");
          break;
        case '"':
          escaped.append("\\\"");
          break;
        case '\n':
          escaped.append("\\n");
          break;
        case '\r':
          escaped.append("\\r");
          break;
        case '\t':
          escaped.append("\\t");
          break;
        default:
          if (character < 0x20) {
            escaped.append(String.format("\\u%04x", (int) character));
          } else {
            escaped.append(character);
          }
      }
    }
    escaped.append('"');
    return escaped.toString();
  }
}
