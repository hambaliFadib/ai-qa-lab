import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Properties;
import java.util.stream.Collectors;

import oracle.jdbc.OraclePreparedStatement;

public class OracleTestdataDmlJdbcRunner {
  public static void main(String[] args) throws Exception {
    if (args.length < 1) {
      throw new IllegalArgumentException("Usage: java OracleTestdataDmlJdbcRunner <request.properties>");
    }

    Properties request = new Properties();
    try (var reader = java.nio.file.Files.newBufferedReader(Path.of(args[0]), StandardCharsets.UTF_8)) {
      request.load(reader);
    }

    String jdbcUrl = requiredEnv("ORACLE_JDBC_URL");
    String jdbcUser = requiredEnv("ORACLE_JDBC_USER");
    String jdbcPassword = requiredEnv("ORACLE_JDBC_PASSWORD");
    boolean commit = Boolean.parseBoolean(request.getProperty("commit", "false"));
    int maxAffectedRows = Integer.parseInt(request.getProperty("maxAffectedRows", "20"));
    int statementCount = Integer.parseInt(request.getProperty("statement.count", "0"));

    if (statementCount <= 0) {
      throw new IllegalArgumentException("No DML statements were provided.");
    }

    Class.forName("oracle.jdbc.OracleDriver");

    List<Result> results = new ArrayList<>();
    try (Connection connection = DriverManager.getConnection(jdbcUrl, jdbcUser, jdbcPassword)) {
      connection.setAutoCommit(false);

      try {
        for (int index = 1; index <= statementCount; index += 1) {
          String prefix = "statement." + index + ".";
          String id = request.getProperty(prefix + "id", "statement-" + index);
          String sql = new String(java.util.Base64.getDecoder().decode(required(request, prefix + "sql.base64")), StandardCharsets.UTF_8);

          try (PreparedStatement baseStatement = connection.prepareStatement(sql)) {
            OraclePreparedStatement statement = (OraclePreparedStatement) baseStatement;
            List<String> bindKeys = request.stringPropertyNames()
              .stream()
              .filter((key) -> key.startsWith(prefix + "bind."))
              .sorted(Comparator.naturalOrder())
              .collect(Collectors.toList());

            for (String key : bindKeys) {
              String bindName = key.substring((prefix + "bind.").length());
              String bindValue = new String(java.util.Base64.getDecoder().decode(request.getProperty(key)), StandardCharsets.UTF_8);
              statement.setStringAtName(bindName, bindValue);
            }

            int affectedRows = statement.executeUpdate();
            if (affectedRows > maxAffectedRows) {
              throw new IllegalStateException("Statement " + id + " affected " + affectedRows + " rows, exceeding maxAffectedRows=" + maxAffectedRows + ".");
            }
            results.add(new Result(id, affectedRows));
          }
        }

        if (commit) {
          connection.commit();
        } else {
          connection.rollback();
        }
      } catch (Exception error) {
        connection.rollback();
        throw error;
      }
    }

    StringBuilder json = new StringBuilder();
    json.append('{');
    json.append("\"committed\":").append(commit);
    json.append(",\"statements\":[");
    for (int index = 0; index < results.size(); index += 1) {
      if (index > 0) {
        json.append(',');
      }
      Result result = results.get(index);
      json.append('{');
      json.append("\"id\":").append(jsonString(result.id));
      json.append(",\"affected_rows\":").append(result.affectedRows);
      json.append('}');
    }
    json.append("]}");
    System.out.print(json.toString());
  }

  private static String requiredEnv(String key) {
    String value = System.getenv(key);
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Missing environment variable: " + key);
    }
    return value;
  }

  private static String required(Properties properties, String key) {
    String value = properties.getProperty(key);
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Missing request property: " + key);
    }
    return value;
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

  private static class Result {
    String id;
    int affectedRows;

    Result(String id, int affectedRows) {
      this.id = id;
      this.affectedRows = affectedRows;
    }
  }
}
