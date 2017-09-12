package alto;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;
import util.Constants;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
@Scope(value= WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class Backend {

    @Value("${alto.data.corpus_name:synthetic}")
    String corpusName;

    @Autowired
    HttpServletRequest req;

    @Autowired
    TopicModeling treeTM;

	public String newSession(String username) throws IOException, ErrorForUI {
		String json="";
		System.out.println(String.format("Creating new session: corpus: %s, username: %s, topicsnum: %s", corpusName, username, Constants.NUM_TOPICS));
		this.treeTM.initializeData();
		json = this.treeTM.changeFormat();
		return json;
	}
}
